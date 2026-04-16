import 'server-only';

import { createHash } from 'node:crypto';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';

type RagMetadata = Record<string, unknown>;

export type RetrievedChunk = {
  chunkId: string;
  rank: number;
  score: number;
  source: string;
  pageNumber: number | null;
  chunkIndex: number | null;
  content: string;
  metadata: RagMetadata;
};

let vectorStore: PineconeStore | null = null;

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function fallbackChunkId(metadata: RagMetadata, content: string) {
  const source = asString(metadata.source) ?? 'unknown';
  const rawPage = asNumber(metadata.page);
  const page =
    asNumber(metadata.page_number) ?? (rawPage !== null ? rawPage + 1 : -1);
  const chunkIndex = asNumber(metadata.chunk_index) ?? -1;
  const contentHash = createHash('sha1')
    .update(
      JSON.stringify({
        source,
        page,
        chunkIndex,
        preview: content.slice(0, 400),
      }),
    )
    .digest('hex')
    .slice(0, 12);

  return `${source}::p${page >= 0 ? page : 'na'}::c${chunkIndex >= 0 ? chunkIndex : 'na'}::${contentHash}`;
}

export async function getVectorStore(): Promise<PineconeStore> {
  if (vectorStore) {
    return vectorStore;
  }

  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  const index = pinecone.Index(process.env.PINECONE_INDEX!);

  vectorStore = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings({ model: 'text-embedding-3-small' }),
    { pineconeIndex: index },
  );

  return vectorStore;
}

export async function retrieveChunks(
  query: string,
  k: number,
): Promise<RetrievedChunk[]> {
  const store = await getVectorStore();
  const results = await store.similaritySearchWithScore(query, k);

  return results.map(([doc, score], index) => {
    const metadata = (doc.metadata ?? {}) as RagMetadata;
    const source = asString(metadata.source) ?? 'unknown';
    const rawPage = asNumber(metadata.page);
    const pageNumber =
      asNumber(metadata.page_number) ?? (rawPage !== null ? rawPage + 1 : null);
    const chunkIndex = asNumber(metadata.chunk_index);
    const chunkId =
      asString(metadata.chunk_id) ?? fallbackChunkId(metadata, doc.pageContent);

    return {
      chunkId,
      rank: index + 1,
      score,
      source,
      pageNumber,
      chunkIndex,
      content: doc.pageContent,
      metadata,
    };
  });
}
