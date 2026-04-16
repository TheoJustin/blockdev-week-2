'use client';

import { useState } from 'react';
import { Loader2, Search, Target, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  SignalCallout,
  SignalFeatureCard,
  SignalIconBadge,
  SignalPageIntro,
  SignalValueCard,
} from '@/components/signal/primitives';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type RagMetrics = {
  precisionAtK: number;
  recallAtK: number;
  mrr: number;
  ndcg: number;
  relevantRetrieved: number;
  totalRelevant: number;
  firstRelevantRank: number | null;
};

type RetrievedChunk = {
  chunkId: string;
  rank: number;
  score: number;
  source: string;
  pageNumber: number | null;
  chunkIndex: number | null;
  content: string;
};

type EvaluationResponse = {
  query: string;
  k: number;
  relevantChunkIds: string[];
  metrics: RagMetrics | null;
  retrievedChunks: RetrievedChunk[];
};

function parseChunkIds(value: string) {
  return [
    ...new Set(
      value
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

export default function RagEvalPage() {
  const [query, setQuery] = useState('');
  const [k, setK] = useState('5');
  const [relevantChunkIdsInput, setRelevantChunkIdsInput] = useState('');
  const [result, setResult] = useState<EvaluationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleEvaluate = async () => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setError('Enter a query to evaluate.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rag-eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmedQuery,
          k: Number(k),
          relevantChunkIds: parseChunkIds(relevantChunkIdsInput),
        }),
      });

      const data = (await response.json()) as EvaluationResponse & {
        error?: string;
        details?: string;
      };

      if (!response.ok) {
        throw new Error(data.details ?? data.error ?? 'Evaluation failed.');
      }

      setResult(data);
    } catch (requestError) {
      console.error(requestError);
      setResult(null);
      setError((requestError as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const relevantSet = new Set(result?.relevantChunkIds ?? []);

  return (
    <div className="space-y-6 pb-10">
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
        <div className="reveal">
          <SignalPageIntro
            badgeIcon={Trophy}
            badgeLabel="RAG Evaluation"
            accentBadge
            title="Measure retrieval quality, not just how polished the final answer sounds."
            description={
              <>
            This screen scores the retriever directly. Give it a query, tell it
            which chunk IDs are truly relevant, and inspect how well the ranked
            results align with your ground truth.
              </>
            }
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Precision@K', 'Top-K purity'],
            ['Recall@K', 'Coverage of relevant chunks'],
            ['MRR', 'How fast the first good hit appears'],
            ['NDCG', 'How well the rank order respects relevance'],
          ].map(([label, helper], index) => (
            <SignalFeatureCard
              key={label}
              eyebrow={String(label)}
              description={helper}
              tone="cyan"
              className="reveal"
              revealDelayMs={index * 90 + 120}
            />
          ))}
        </div>
      </section>

      <Card className="signal-panel rounded-[32px] text-foreground reveal" style={{ animationDelay: '150ms' }}>
        <CardHeader className="border-b border-white/[0.08] pb-6">
          <CardTitle className="flex items-center gap-3 text-2xl font-semibold tracking-[-0.04em]">
            <SignalIconBadge icon={Search} tone="amber" />
            Retrieval Benchmark
          </CardTitle>
          <CardDescription className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Leave ground-truth IDs empty if you want to inspect retrieved chunks
            first. Recall is only meaningful when your relevant chunk list
            includes the full set of truly relevant chunks for that query.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-5 pt-6">
          <div className="grid gap-2">
            <label
              htmlFor="rag-eval-query"
              className="text-sm font-medium text-foreground"
            >
              Query
            </label>
            <Textarea
              id="rag-eval-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. What does the paper say about Google Meet pricing tiers?"
              className="min-h-[7.5rem] border-white/10 bg-white/[0.04]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
            <div className="grid gap-2">
              <label
                htmlFor="rag-eval-k"
                className="text-sm font-medium text-foreground"
              >
                Top K
              </label>
              <input
                id="rag-eval-k"
                type="number"
                min={1}
                max={20}
                value={k}
                onChange={(event) => setK(event.target.value)}
                className="h-12 rounded-[22px] border border-white/10 bg-white/[0.04] px-4 text-sm text-foreground outline-none transition focus:border-[var(--signal-cyan)]"
              />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="rag-eval-ground-truth"
                className="text-sm font-medium text-foreground"
              >
                Relevant Chunk IDs
              </label>
              <Textarea
                id="rag-eval-ground-truth"
                value={relevantChunkIdsInput}
                onChange={(event) => setRelevantChunkIdsInput(event.target.value)}
                placeholder={`One chunk ID per line, for example:\nreport.pdf::p2::c3::abc123def456`}
                className="min-h-[7.5rem] border-white/10 bg-white/[0.04] font-mono text-xs leading-6"
              />
            </div>
          </div>

          <SignalCallout icon={Target}>
            Stable chunk IDs are generated for new uploads. Older chunks still
            receive deterministic fallback IDs for evaluation.
          </SignalCallout>
          <div className="-mt-2 flex justify-end">
            <Button onClick={handleEvaluate} disabled={isLoading} size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running
                </>
              ) : (
                'Run Retrieval Evaluation'
              )}
            </Button>
          </div>
          {error && (
            <div className="rounded-[22px] border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 reveal" style={{ animationDelay: '220ms' }}>
            <SignalValueCard
              eyebrow={`Precision@${result.k}`}
              value={result.metrics ? result.metrics.precisionAtK.toFixed(4) : 'N/A'}
              helper="Fraction of the top-K retrieved chunks that are relevant."
            />
            <SignalValueCard
              eyebrow={`Recall@${result.k}`}
              value={result.metrics ? result.metrics.recallAtK.toFixed(4) : 'N/A'}
              helper="Fraction of all known relevant chunks that appear in the top-K."
            />
            <SignalValueCard
              eyebrow="MRR"
              value={result.metrics ? result.metrics.mrr.toFixed(4) : 'N/A'}
              helper="Single-query reciprocal rank of the first relevant chunk."
            />
            <SignalValueCard
              eyebrow="NDCG"
              value={result.metrics ? result.metrics.ndcg.toFixed(4) : 'N/A'}
              helper="Discounted ranking quality with binary relevance labels."
            />
          </div>

          <Card className="signal-panel rounded-[32px] text-foreground reveal" style={{ animationDelay: '260ms' }}>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold tracking-[-0.04em]">
                Retrieved Chunks
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-muted-foreground">
                Review the exact chunks returned for{' '}
                <span className="font-medium text-foreground">{result.query}</span>.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {result.metrics && (
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-6 text-muted-foreground">
                  Retrieved {result.metrics.relevantRetrieved} relevant chunks
                  out of {result.metrics.totalRelevant} labeled relevant chunks.
                  The first relevant chunk appeared at rank{' '}
                  {result.metrics.firstRelevantRank ?? 'not found'}.
                </div>
              )}

              <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="w-16 px-5 py-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Rank
                      </TableHead>
                      <TableHead className="w-28 px-5 py-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Score
                      </TableHead>
                      <TableHead className="w-36 px-5 py-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Match
                      </TableHead>
                      <TableHead className="px-5 py-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Chunk
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.retrievedChunks.map((chunk) => {
                      const isRelevant = relevantSet.has(chunk.chunkId);

                      return (
                        <TableRow
                          key={chunk.chunkId}
                          className="border-white/[0.08] align-top hover:bg-white/[0.03]"
                        >
                          <TableCell className="px-5 py-5 font-medium text-foreground">
                            {chunk.rank}
                          </TableCell>
                          <TableCell className="px-5 py-5 font-mono text-xs text-muted-foreground">
                            {chunk.score.toFixed(4)}
                          </TableCell>
                          <TableCell className="px-5 py-5">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                                relevantSet.size === 0
                                  ? 'border border-white/10 bg-white/[0.04] text-muted-foreground'
                                  : isRelevant
                                    ? 'border border-emerald-400/30 bg-emerald-400/12 text-emerald-200'
                                    : 'border border-white/10 bg-white/[0.04] text-muted-foreground'
                              }`}
                            >
                              {relevantSet.size === 0
                                ? 'Unlabeled'
                                : isRelevant
                                  ? 'Relevant'
                                  : 'Not labeled'}
                            </span>
                          </TableCell>
                          <TableCell className="space-y-3 px-5 py-5 whitespace-normal">
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-foreground">
                                {chunk.source}
                                {chunk.pageNumber ? ` · page ${chunk.pageNumber}` : ''}
                              </div>
                              <div className="font-mono text-[11px] leading-5 text-muted-foreground break-all">
                                {chunk.chunkId}
                              </div>
                            </div>
                            <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                              {chunk.content}
                            </p>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
