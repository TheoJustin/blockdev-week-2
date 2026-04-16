// src/app/api/rag-chat/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { retrieveChunks } from '@/lib/rag';

function getOpenAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: Request) {
  try {
    const { message }: { message: string } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'No message provided' },
        { status: 400 },
      );
    }

    // 1. Retrieve top-5 most relevant chunks from Pinecone
    const results = await retrieveChunks(message, 5);

    if (results.length === 0) {
      return NextResponse.json({
        response:
          "I couldn't find any relevant information in the uploaded research PDFs. Try uploading a competitor comparison report first.",
      });
    }

    // 2. Build context from retrieved chunks
    const context = results
      .map(
        (chunk) =>
          `[Source ${chunk.rank}: ${chunk.source}${
            chunk.pageNumber ? `, page ${chunk.pageNumber}` : ''
          }]\n${chunk.content}`,
      )
      .join('\n\n---\n\n');

    // 3. Call OpenAI with context + user question
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `You are a helpful competitor analysis research assistant.
Answer the user's question strictly based on the provided document context from uploaded reports about platforms, products, services, plans, pricing, and explicit pros or cons.
If the answer is not in the context, say so clearly instead of guessing.
When useful, cite the supporting source in brackets such as [Source 2, page 5].

Document context:
${context}`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
    });

    const response =
      completion.choices[0]?.message?.content ??
      'Sorry, I was unable to generate a response.';

    return NextResponse.json({ response });
  } catch (error) {
    console.error('RAG chat error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process your question',
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
