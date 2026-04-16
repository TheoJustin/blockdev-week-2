import { NextResponse } from 'next/server';
import { computeRagMetrics, normalizeChunkIds } from '@/lib/rag-evaluation';
import { retrieveChunks } from '@/lib/rag';

const DEFAULT_K = 5;
const MAX_K = 20;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      query?: string;
      k?: number;
      relevantChunkIds?: string[];
    };

    const query = body.query?.trim();

    if (!query) {
      return NextResponse.json({ error: 'No query provided.' }, { status: 400 });
    }

    const requestedK = Number(body.k ?? DEFAULT_K);
    const k = Number.isFinite(requestedK)
      ? Math.min(Math.max(Math.floor(requestedK), 1), MAX_K)
      : DEFAULT_K;
    const relevantChunkIds = normalizeChunkIds(body.relevantChunkIds ?? []);

    const retrievedChunks = await retrieveChunks(query, k);
    const metrics =
      relevantChunkIds.length > 0
        ? computeRagMetrics(retrievedChunks, relevantChunkIds, k)
        : null;

    return NextResponse.json({
      query,
      k,
      relevantChunkIds,
      metrics,
      retrievedChunks,
    });
  } catch (error) {
    console.error('RAG evaluation error:', error);

    return NextResponse.json(
      {
        error: 'Failed to evaluate retrieval quality.',
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
