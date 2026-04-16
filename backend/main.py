import hashlib
import os
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.prompts import PromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv
import tempfile

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://frontend:3000", 
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pinecone client setup ---
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
PINECONE_INDEX = os.getenv("PINECONE_INDEX", "competitor-analysis")


def ensure_index_exists():
    existing = [i.name for i in pc.list_indexes()]
    if PINECONE_INDEX not in existing:
        pc.create_index(
            name=PINECONE_INDEX,
            dimension=1536,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )


def normalize_text_block(value: str) -> str:
    return "\n".join(
        line for line in (" ".join(raw.split()) for raw in value.splitlines()) if line
    ).strip()


def is_references_page(value: str) -> bool:
    lines = [line.strip().lower() for line in value.splitlines() if line.strip()]
    return bool(lines and lines[0] == "references")


def build_extraction_text(docs) -> str:
    pages: List[str] = []

    for page_number, doc in enumerate(docs, start=1):
        content = normalize_text_block(doc.page_content)
        if not content:
            continue

        if is_references_page(content):
            break

        pages.append(f"[Page {page_number}]\n{content}")

    return "\n\n".join(pages)


def clean_optional_text(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None

    cleaned = " ".join(value.split()).strip()
    return cleaned or None


# --- 1. Pydantic Models ---
class FeatureAnalysis(BaseModel):
    competitor_name: str = Field(
        description="The canonical name of the specific platform, product, or service explicitly discussed in the report (e.g., 'Google Meet', 'Microsoft Teams', 'Zoom'). Never use a generic market label such as 'video conferencing platforms' or 'e-learning tools'."
    )
    feature_name: str = Field(
        description="A concrete capability, plan-specific offering, limit, or differentiator tied to that competitor (e.g., 'Free tier: up to 100 participants for 1 hour', 'Speech-recognition subtitles', 'Chat, calls, and document sharing/editing'). Do not use market trends, generic themes, or industry categories as features."
    )
    price: Optional[str] = Field(
        default=None,
        description="Exact price, billing phrase, or plan label explicitly stated in the source (e.g., 'Free', 'USD 8 per active user/month', '139.90 EUR / year/license'). Leave null if not explicitly mentioned."
    )
    advantages: Optional[str] = Field(
        default=None,
        description="An explicit source-grounded strength, convenience, or benefit tied to this competitor or feature. Leave null if the source does not state one."
    )
    disadvantages: Optional[str] = Field(
        default=None,
        description="An explicit source-grounded limitation, drawback, or constraint tied to this competitor or feature (e.g., 'Free tier limited to 1 hour'). Leave null if the source does not state one."
    )


class ExtractionResult(BaseModel):
    results: List[FeatureAnalysis] = Field(
        description="List of SQL-ready competitor rows extracted from the report. Only include rows with a named competitor and a concrete capability, plan detail, limit, price point, or explicit advantage/disadvantage."
    )


class SQLResponse(BaseModel):
    sql: str
    chunks_indexed: int


@app.post("/process-pdf", response_model=SQLResponse)
async def process_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    try:
        # 1. Save and load PDF
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        loader = PyPDFLoader(tmp_path)
        docs = loader.load()
        os.remove(tmp_path)

        extraction_text = build_extraction_text(docs)
        if not extraction_text:
            extraction_text = "\n".join([doc.page_content for doc in docs])

        # 2. Structured SQL extraction
        llm = ChatOpenAI(model="gpt-4o", temperature=0)
        structured_llm = llm.with_structured_output(ExtractionResult)

        template = """
        You are an expert data extraction system that converts competitor comparison PDFs into SQL-ready rows.

        The uploaded files are research or comparison reports about software platforms, SaaS tools, digital services, or products.
        Your output feeds a competitor analysis table used for structured SQL questions.

        Extract rows that help answer questions like:
        - What capabilities does each platform provide?
        - What plan tiers, participant limits, storage limits, support levels, or usage limits are mentioned?
        - What prices or billing phrases are stated?
        - What explicit advantages or disadvantages are stated for a platform, plan, or feature?

        CRITICAL RULES:
        1. competitor_name must be the canonical product or platform name explicitly mentioned in the source.
           Good: Google Meet, Microsoft Teams, Zoom
           Bad: E-learning platforms, Video conferencing software, Business Standard
        2. feature_name must be a concrete capability, plan-specific offer, usage limit, or differentiator.
           Good: Free tier: up to 100 participants for 1 hour
                 Speech-recognition subtitles
                 Chat, calls, and document sharing/editing
                 Business plan: recording transcripts and managed domains
           Bad: Online teaching, COVID-19 crisis, Market growth, Distance learning
        3. Include plan-specific rows when a named tier has materially different pricing or capabilities.
           Keep the platform name in competitor_name and put the tier details in feature_name.
        4. Put the exact price or plan label in price when it is explicit in the source.
           Examples: Free, Paid version, USD 8 per active user/month, 139.90 EUR / year/license
        5. advantages and disadvantages must be source-grounded.
           Only include them when the document explicitly states a benefit, limitation, or constraint.
           Do not invent disadvantages from missing information.
        6. Do not create rows for generic e-learning pros/cons unless they are explicitly tied to a named competitor.
        7. Ignore references, citations, URLs, figure captions, DOI/ORCID metadata, and duplicated boilerplate.
        8. Translate non-English text to clear English when necessary.
        9. If a competitor has multiple distinct features or plan tiers, create separate rows.
        10. If a section does not contain a concrete competitor capability, plan, price, explicit advantage, or explicit disadvantage, skip it.
        11. Prefer concise, SQL-friendly field values over long paragraphs.

        <input_text>
        {text}
        </input_text>
        """
        chain = PromptTemplate.from_template(template) | structured_llm
        response_data = chain.invoke({"text": extraction_text})

        safe_pdf_name = file.filename.replace("'", "''")

        sql_statements = []
        seen_rows = set()
        for row in response_data.results:
            competitor_name = clean_optional_text(row.competitor_name)
            feature_name = clean_optional_text(row.feature_name)
            price_value = clean_optional_text(row.price)
            advantages_value = clean_optional_text(row.advantages)
            disadvantages_value = clean_optional_text(row.disadvantages)

            if not competitor_name or not feature_name:
                continue

            dedupe_key = (
                competitor_name.casefold(),
                feature_name.casefold(),
                (price_value or "").casefold(),
            )
            if dedupe_key in seen_rows:
                continue
            seen_rows.add(dedupe_key)

            comp_name = competitor_name.replace("'", "''")
            feat_name = feature_name.replace("'", "''")
            price = (
                f"'{price_value.replace(chr(39), chr(39) * 2)}'"
                if price_value
                else "NULL"
            )
            adv = (
                f"'{advantages_value.replace(chr(39), chr(39) * 2)}'"
                if advantages_value
                else "NULL"
            )
            disadv = (
                f"'{disadvantages_value.replace(chr(39), chr(39) * 2)}'"
                if disadvantages_value
                else "NULL"
            )
            sql_statements.append(
                f"INSERT INTO competitor_analysis (competitor_name, feature_name, price, advantages, disadvantages, pdf_name) "
                f"VALUES ('{comp_name}', '{feat_name}', {price}, {adv}, {disadv}, '{safe_pdf_name}');"
            )

        final_sql = "\n".join(sql_statements)

        # 3. Chunk + embed + upsert raw PDF pages into Pinecone
        ensure_index_exists()

        # Attach filename as metadata so the chatbot knows which PDF a chunk came from
        for doc in docs:
            doc.metadata["source"] = file.filename
            doc.metadata["document_name"] = file.filename

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
        )
        chunks = splitter.split_documents(docs)

        for chunk_index, chunk in enumerate(chunks):
            page = chunk.metadata.get("page")
            page_number = page + 1 if isinstance(page, int) else None
            content_hash = hashlib.sha1(
                chunk.page_content.encode("utf-8")
            ).hexdigest()[:12]

            chunk.metadata["chunk_index"] = chunk_index
            chunk.metadata["page_number"] = page_number
            chunk.metadata["chunk_id"] = (
                f"{file.filename}::p{page_number or 'na'}::c{chunk_index}::{content_hash}"
            )

        PineconeVectorStore.from_documents(
            documents=chunks,
            embedding=OpenAIEmbeddings(model="text-embedding-3-small"),
            index_name=PINECONE_INDEX,
        )

        print(f"✅ Indexed {len(chunks)} chunks from '{file.filename}' into Pinecone")

        return SQLResponse(sql=final_sql, chunks_indexed=len(chunks))

    except Exception as e:
        print(f"Error processing PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
