'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  SignalBadge,
  SignalFeatureCard,
  SignalPageIntro,
  SignalValueCard,
} from '@/components/signal/primitives';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  ArrowRight,
  CheckCircle2,
  Database,
  FileSearch,
  Loader2,
  Radar,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedSql, setGeneratedSql] = useState<string | null>(null);
  const [parsedSqlLines, setParsedSqlLines] = useState<string[]>([]);
  const [chunksIndexed, setChunksIndexed] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const parseSqlToLines = (sql: string): string[] => {
    return sql
      .split(/;\s*\n+/g)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => (line.endsWith(';') ? line : `${line};`));
  };

  const handleExtract = async () => {
    if (!file) {
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/process-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? 'Extraction failed.');
      }

      setGeneratedSql(data.sql);
      setParsedSqlLines(parseSqlToLines(data.sql));
      setChunksIndexed(data.chunks_indexed ?? null);
    } catch (error) {
      console.error('Upload failed', error);
      setErrorMessage((error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!generatedSql) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: generatedSql }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details ?? data.error ?? 'SQL execution failed.');
      }

      router.push('/chat');
    } catch (error) {
      console.error('Database insertion failed', error);
      setErrorMessage((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setGeneratedSql(null);
    setParsedSqlLines([]);
    setChunksIndexed(null);
    setErrorMessage(null);
  };

  const workflow = [
    {
      icon: FileSearch,
      title: 'Read the report',
      description:
        'We extract raw page text so the original evidence is still queryable later.',
    },
    {
      icon: Database,
      title: 'Shape it into rows',
      description:
        'The structured path turns competitor features into SQL-ready records you can review.',
    },
    {
      icon: Radar,
      title: 'Index the source',
      description:
        'Chunks are embedded into Pinecone so the RAG flow can retrieve narrative evidence.',
    },
  ];

  const hasReviewState = parsedSqlLines.length > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
      <section className="space-y-6 reveal">
        <SignalPageIntro
          badgeIcon={Sparkles}
          badgeLabel="Document Intake"
          accentBadge
          title="Pull a report into both your SQL layer and your retrieval layer."
          description={
            <>
            This upload flow is where the app becomes a real hybrid system.
            Every PDF creates structured competitor rows for exact comparisons
            and raw chunk embeddings for retrieval-backed answers.
            </>
          }
          titleClassName="max-w-xl"
          descriptionClassName="max-w-xl"
        />

        <div className="grid gap-4">
          {workflow.map(({ icon: Icon, title, description }, index) => (
            <SignalFeatureCard
              key={title}
              icon={Icon}
              title={title}
              description={description}
              tone="amber"
              className="rounded-[28px] p-5 reveal"
              revealDelayMs={index * 120 + 80}
            />
          ))}
        </div>

        <div className="signal-panel rounded-[30px] p-6 reveal" style={{ animationDelay: '180ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--signal-cyan)]">
                Output Channels
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                One upload, two answer paths
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <SignalFeatureCard
              title="Structured SQL chat"
              description="Best for exact feature and pricing comparisons across competitors."
              className="rounded-[24px] border border-white/10 bg-white/[0.03]"
            />
            <SignalFeatureCard
              title="RAG chat and eval"
              description="Best for source-grounded questions and retrieval benchmarking."
              className="rounded-[24px] border border-white/10 bg-white/[0.03]"
            />
          </div>
        </div>
      </section>

      <section className="reveal" style={{ animationDelay: '120ms' }}>
        <Card className="signal-panel rounded-[32px] border-white/10 text-foreground">
          <CardHeader className="border-b border-white/[0.08] pb-6">
            <CardTitle className="text-2xl font-semibold tracking-[-0.04em]">
              {hasReviewState ? 'Review Extracted Statements' : 'Upload a PDF'}
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {hasReviewState
                ? 'Inspect the generated SQL before it lands in PostgreSQL. This keeps the structured layer transparent and reviewable.'
                : 'Choose a competitor report. We will extract structured insights, chunk the raw source text, and index the document for retrieval.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            {parsedSqlLines.length === 0 ? (
              <div className="space-y-5">
                <label
                  htmlFor="pdf-upload"
                  className={`group flex cursor-pointer flex-col items-center justify-center rounded-[30px] border border-dashed px-8 py-16 text-center transition-all ${
                    file
                      ? 'border-[rgba(242,186,123,0.34)] bg-[rgba(242,186,123,0.08)]'
                      : 'border-white/[0.12] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-[24px] border border-white/10 bg-white/[0.04] text-[var(--signal-amber)] transition-transform group-hover:-translate-y-0.5">
                    <UploadCloud className="h-8 w-8" />
                  </div>
                  <div className="mt-6 text-xl font-semibold tracking-[-0.03em] text-foreground">
                    {file ? file.name : 'Drop a competitor report here'}
                  </div>
                  <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                    Use a text-based PDF for the best extraction quality. The
                    review step remains manual so you can inspect what will hit
                    the database.
                  </p>
                  <SignalBadge
                    icon={CheckCircle2}
                    label="PDF up to 10MB"
                    className="mt-5"
                  />
                  <Input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(event) => setFile(event.target.files?.[0] || null)}
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-3">
                  <SignalFeatureCard
                    eyebrow="SQL Review"
                    description="Generated inserts stay visible before execution."
                    tone="cyan"
                    className="rounded-[22px] border border-white/10 bg-white/[0.03]"
                  />
                  <SignalFeatureCard
                    eyebrow="Chunking"
                    description="Pages are split into retrieval-ready semantic segments."
                    tone="blue"
                    className="rounded-[22px] border border-white/10 bg-white/[0.03]"
                  />
                  <SignalFeatureCard
                    eyebrow="Pinecone"
                    description="Raw evidence becomes available to the RAG workflow."
                    tone="amber"
                    className="rounded-[22px] border border-white/10 bg-white/[0.03]"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <SignalValueCard
                    eyebrow="Statements"
                    value={parsedSqlLines.length}
                    helper="SQL rows ready for review."
                    tone="cyan"
                    className="rounded-[22px] border border-white/10 bg-white/[0.03]"
                  />
                  <SignalValueCard
                    eyebrow="Chunks Indexed"
                    value={chunksIndexed ?? '—'}
                    helper="Semantic chunks sent to Pinecone."
                    tone="blue"
                    className="rounded-[22px] border border-white/10 bg-white/[0.03]"
                  />
                  <SignalValueCard
                    eyebrow="Source File"
                    value={
                      <span className="block truncate text-lg">
                        {file?.name ?? 'Uploaded PDF'}
                      </span>
                    }
                    helper="Current upload under review."
                    tone="amber"
                    className="rounded-[22px] border border-white/10 bg-white/[0.03]"
                  />
                </div>

                <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]">
                  <Table className="min-w-[760px] table-fixed">
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="w-16 px-5 py-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          #
                        </TableHead>
                        <TableHead className="px-5 py-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Generated SQL Statement
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedSqlLines.map((line, index) => (
                        <TableRow
                          key={`${line}-${index}`}
                          className="border-white/[0.08] hover:bg-white/[0.03]"
                        >
                          <TableCell className="px-5 py-4 align-top font-mono text-xs text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell className="px-5 py-4 font-mono text-xs leading-6 whitespace-pre-wrap break-all text-foreground">
                            {line}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="mt-5 rounded-[22px] border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">
                {errorMessage}
              </div>
            )}
          </CardContent>

          {!hasReviewState ? (
            <CardFooter className="justify-end border-white/[0.08] bg-transparent pt-6">
              <Button
                onClick={handleExtract}
                disabled={!file || isUploading}
                size="lg"
                className="px-6"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting
                  </>
                ) : (
                  <>
                    Extract Data <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          ) : (
            <CardFooter className="flex flex-col gap-3 border-white/[0.08] bg-transparent pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isSubmitting}
                size="lg"
                className="w-full border-white/10 bg-white/[0.03] sm:w-auto"
              >
                <X className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                size="lg"
                className="w-full px-6 sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executing SQL
                  </>
                ) : (
                  <>
                    Confirm and Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          )}
        </Card>
      </section>
    </div>
  );
}
