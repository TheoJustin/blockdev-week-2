import type { RetrievedChunk } from '@/lib/rag';

export type RagMetrics = {
  precisionAtK: number;
  recallAtK: number;
  mrr: number;
  ndcg: number;
  relevantRetrieved: number;
  totalRelevant: number;
  firstRelevantRank: number | null;
};

function roundMetric(value: number) {
  return Number(value.toFixed(4));
}

export function normalizeChunkIds(chunkIds: string[]) {
  return [...new Set(chunkIds.map((chunkId) => chunkId.trim()).filter(Boolean))];
}

export function computeRagMetrics(
  retrievedChunks: RetrievedChunk[],
  relevantChunkIds: string[],
  k: number,
): RagMetrics {
  const normalizedRelevant = normalizeChunkIds(relevantChunkIds);
  const relevantSet = new Set(normalizedRelevant);
  const topK = retrievedChunks.slice(0, k);

  let dcg = 0;
  let relevantRetrieved = 0;
  let firstRelevantRank: number | null = null;

  topK.forEach((chunk, index) => {
    const isRelevant = relevantSet.has(chunk.chunkId);

    if (!isRelevant) {
      return;
    }

    relevantRetrieved += 1;

    if (firstRelevantRank === null) {
      firstRelevantRank = index + 1;
    }

    dcg += 1 / Math.log2(index + 2);
  });

  const idealHits = Math.min(k, relevantSet.size);
  let idcg = 0;

  for (let index = 0; index < idealHits; index += 1) {
    idcg += 1 / Math.log2(index + 2);
  }

  return {
    precisionAtK: roundMetric(relevantRetrieved / k),
    recallAtK: roundMetric(relevantRetrieved / relevantSet.size),
    mrr: roundMetric(firstRelevantRank ? 1 / firstRelevantRank : 0),
    ndcg: roundMetric(idcg === 0 ? 0 : dcg / idcg),
    relevantRetrieved,
    totalRelevant: relevantSet.size,
    firstRelevantRank,
  };
}
