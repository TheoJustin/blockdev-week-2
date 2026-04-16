import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  SignalBadge,
  SignalFeatureCard,
  SignalPageIntro,
} from '@/components/signal/primitives';
import {
  ArrowRight,
  Bot,
  Database,
  FileSearch,
  Radar,
  Sparkles,
} from 'lucide-react';

export default function LandingPage() {
  const routes = [
    {
      href: '/upload',
      icon: FileSearch,
      title: 'Ingest Reports',
      description:
        'Upload research PDFs, review structured extraction, and index the raw source for retrieval.',
    },
    {
      href: '/chat',
      icon: Database,
      title: 'Ask Exact Questions',
      description:
        'Use the SQL assistant when you want crisp comparisons anchored to normalized competitor rows.',
    },
    {
      href: '/rag-eval',
      icon: Radar,
      title: 'Audit Retrieval',
      description:
        'Benchmark chunk ranking quality with Precision@K, Recall@K, MRR, and NDCG.',
    },
  ];

  const signals = [
    ['Structured extraction', 'LLM to SQL-ready competitor records'],
    ['Semantic retrieval', 'Pinecone-backed top-K chunk recall'],
    ['Human review', 'Generated SQL stays visible before execution'],
  ];

  return (
    <div className="space-y-8 pb-10">
      <section className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <div className="space-y-6 reveal">
          <SignalPageIntro
            badgeIcon={Sparkles}
            badgeLabel="Competitor Signal Room"
            accentBadge
            title="Turn dense research PDFs into a workspace you can interrogate."
            description={
              <>
              THChat blends two modes of evidence. One path extracts clean
              competitor records for exact SQL-backed answers. The other keeps
              the raw document alive in a semantic index so you can retrieve
              narrative evidence when structure alone is not enough.
              </>
            }
            titleClassName="signal-heading max-w-4xl text-[var(--signal-sand)]"
            descriptionClassName="signal-subcopy max-w-2xl text-base sm:text-lg"
          />

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="px-6">
              <Link href="/upload">
                Start with a Report <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/[0.12] bg-white/[0.03] px-6"
            >
              <Link href="/rag-eval">Measure Retrieval Quality</Link>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {signals.map(([title, description], index) => (
              <SignalFeatureCard
                key={title}
                eyebrow={title}
                description={description}
                tone="cyan"
                className="reveal"
                revealDelayMs={index * 120 + 120}
              />
            ))}
          </div>
        </div>

        <div
          className="signal-panel signal-glow rounded-[32px] p-6 reveal"
          style={{ animationDelay: '140ms' }}
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--signal-cyan)]">
                System View
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                Two evidence engines, one interface
              </div>
            </div>
            <SignalBadge icon={Bot} label="SQL + RAG" />
          </div>

          <div className="grid gap-4">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-foreground">Upload pipeline</span>
                <span className="font-mono text-xs text-muted-foreground">
                  Active
                </span>
              </div>
              <div className="space-y-3">
                {[
                  'Parse PDF pages and split into semantically reusable chunks',
                  'Extract competitor features into a structured SQL review layer',
                  'Index raw evidence in Pinecone for retrieval-backed answers',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 text-sm text-muted-foreground"
                  >
                    <span className="mt-2 h-2 w-2 rounded-full bg-[var(--signal-amber)]" />
                    <span className="leading-6">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SignalFeatureCard
                eyebrow="SQL Lens"
                description="Best when you want exact competitor, feature, price, and pros versus cons comparisons."
                tone="blue"
                className="rounded-[24px] border border-white/10 bg-white/[0.03]"
              />
              <SignalFeatureCard
                eyebrow="Retrieval Lens"
                description="Best when the answer lives in narrative source text, not a single normalized column."
                tone="cyan"
                className="rounded-[24px] border border-white/10 bg-white/[0.03]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5 reveal" style={{ animationDelay: '220ms' }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SignalBadge label="Choose your route" />
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
              Move from ingestion to interrogation
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Each screen is tuned for a different step in the workflow: loading
            documents, querying normalized facts, or validating retrieval
            quality.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {routes.map(({ href, icon: Icon, title, description }, index) => (
            <Link
              key={href}
              href={href}
              className="signal-panel group rounded-[30px] p-6 transition-transform duration-200 hover:-translate-y-1"
              style={{ animationDelay: `${index * 110 + 260}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[var(--signal-amber)]">
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
              </div>
              <h3 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
