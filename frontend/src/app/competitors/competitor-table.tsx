'use client';

import Link from 'next/link';
import { useDeferredValue, useState } from 'react';
import {
  SignalFeatureCard,
  SignalPageIntro,
  SignalValueCard,
} from '@/components/signal/primitives';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Database,
  FileSearch,
  FileText,
  Search,
  Sparkles,
  X,
} from 'lucide-react';

interface Competitor {
  id: number;
  competitor_name: string;
  feature_name: string;
  price: string | null;
  advantages: string | null;
  disadvantages: string | null;
  pdf_name: string | null;
}

export default function CompetitorTable({
  initialData,
  tableReady,
}: {
  initialData: Competitor[];
  tableReady: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredData = initialData.filter((row) => {
    const query = deferredSearchQuery.toLowerCase();
    const matchName =
      row.competitor_name?.toLowerCase().includes(query) || false;
    const matchPdf = row.pdf_name?.toLowerCase().includes(query) || false;
    const matchFeature =
      row.feature_name?.toLowerCase().includes(query) || false;

    return matchName || matchPdf || matchFeature;
  });

  const totalCompetitors = new Set(
    initialData.map((row) => row.competitor_name).filter(Boolean),
  ).size;
  const totalReports = new Set(
    initialData.map((row) => row.pdf_name).filter(Boolean),
  ).size;
  const entriesWithPricing = initialData.filter((row) => row.price).length;

  if (!tableReady) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="signal-panel w-full max-w-2xl rounded-[32px] p-8 text-center">
          <SignalFeatureCard
            icon={FileText}
            title="No competitor data yet"
            description="Upload a PDF first so the app can extract structured rows into PostgreSQL and index raw document chunks for retrieval."
            tone="amber"
            className="rounded-[28px] border-none bg-transparent p-0 shadow-none"
          />
          <Link
            href="/upload"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[linear-gradient(135deg,#f8dfb5_0%,#f2ba7b_100%)] px-5 py-3 text-sm font-medium text-[#07101d] shadow-[0_14px_35px_rgba(242,186,123,0.24)] transition hover:-translate-y-0.5"
          >
            <FileSearch className="h-4 w-4" />
            Go to Upload
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="reveal">
          <SignalPageIntro
            badgeIcon={Sparkles}
            badgeLabel="Structured Browser"
            accentBadge
            title="Explore the normalized competitor layer before you ask the model."
            description={
              <>
            This table is the evidence base for the SQL assistant. Search it
            directly when you want to sanity check extracted features, pricing,
            and pros versus cons before moving into conversational analysis.
              </>
            }
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Rows', filteredData.length, 'Currently visible records'],
            ['Competitors', totalCompetitors, 'Unique platforms or products'],
            ['Reports', totalReports, 'Source documents indexed'],
            ['Pricing', entriesWithPricing, 'Rows with explicit price data'],
          ].map(([label, value, helper], index) => (
            <SignalValueCard
              key={`${label}-${index}`}
              eyebrow={String(label)}
              value={value}
              helper={helper}
              tone="cyan"
              className="reveal"
              revealDelayMs={index * 90 + 100}
            />
          ))}
        </div>
      </section>

      <Card className="signal-panel rounded-[32px] text-foreground reveal" style={{ animationDelay: '180ms' }}>
        <CardContent className="space-y-5 pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--signal-blue)]">
                Search and inspect
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground">
                Competitor analysis records
              </div>
            </div>

            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search competitor, feature, or source PDF..."
                className="h-12 rounded-[22px] border-white/10 bg-white/[0.04] pl-11 pr-11"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-muted-foreground">
            Showing {filteredData.length} row{filteredData.length === 1 ? '' : 's'}
            {deferredSearchQuery
              ? ` matching "${deferredSearchQuery}".`
              : ' across the extracted competitor dataset.'}
          </div>

          {filteredData.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-white/[0.12] bg-white/[0.03] px-6 py-12 text-center text-muted-foreground">
              {searchQuery
                ? `No results found for "${searchQuery}".`
                : 'No competitor data found. Upload a PDF first.'}
            </div>
          ) : (
            <>
              <div className="grid gap-4 lg:hidden">
                {filteredData.map((row) => (
                  <article
                    key={row.id}
                    className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold tracking-[-0.03em] text-foreground">
                          {row.competitor_name}
                        </h2>
                        <p className="mt-1 text-sm text-[var(--signal-cyan)]">
                          {row.feature_name}
                        </p>
                      </div>
                      {row.price ? (
                        <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-medium text-[var(--signal-sand)]">
                          {row.price}
                        </span>
                      ) : null}
                    </div>

                    {row.pdf_name && (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />
                        {row.pdf_name}
                      </div>
                    )}

                    <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                      <div>
                        <div className="text-xs uppercase tracking-[0.16em] text-[var(--signal-amber)]">
                          Advantages
                        </div>
                        <p className="mt-1">{row.advantages || '—'}</p>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.16em] text-[var(--signal-blue)]">
                          Disadvantages
                        </div>
                        <p className="mt-1">{row.disadvantages || '—'}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] lg:block">
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="w-[18%] px-5 py-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Competitor
                      </TableHead>
                      <TableHead className="w-[17%] px-5 py-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Feature
                      </TableHead>
                      <TableHead className="w-[12%] px-5 py-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Price
                      </TableHead>
                      <TableHead className="w-[26%] px-5 py-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Advantages
                      </TableHead>
                      <TableHead className="w-[27%] px-5 py-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Disadvantages
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((row) => (
                      <TableRow
                        key={row.id}
                        className="border-white/[0.08] align-top hover:bg-white/[0.03]"
                      >
                        <TableCell className="px-5 py-5 align-top whitespace-normal">
                          <div className="space-y-2">
                            <div className="font-semibold tracking-[-0.02em] text-foreground">
                              {row.competitor_name}
                            </div>
                            {row.pdf_name && (
                              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-muted-foreground">
                                <FileText className="h-3.5 w-3.5" />
                                <span className="truncate" title={row.pdf_name}>
                                  {row.pdf_name}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-5 align-top whitespace-normal text-[var(--signal-cyan)]">
                          {row.feature_name}
                        </TableCell>
                        <TableCell className="px-5 py-5 align-top">
                          {row.price ? (
                            <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-medium text-[var(--signal-sand)]">
                              {row.price}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-5 align-top whitespace-normal text-sm leading-7 text-muted-foreground">
                          {row.advantages || '—'}
                        </TableCell>
                        <TableCell className="px-5 py-5 align-top whitespace-normal text-sm leading-7 text-muted-foreground">
                          {row.disadvantages || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
