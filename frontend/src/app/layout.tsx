import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'THChat',
  description: 'Competitor analysis powered by AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const links = [
    ['/', 'Home'],
    ['/upload', 'Upload'],
    ['/chat', 'SQL Chat'],
    ['/competitors', 'Data'],
    ['/rag-chat', 'RAG Chat'],
    ['/rag-eval', 'RAG Eval'],
  ];

  return (
    <html lang="en" className="dark">
      <body
        className={`${manrope.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute left-[-8rem] top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(130,182,255,0.18),transparent_72%)] blur-2xl" />
          <div className="pointer-events-none absolute right-[-8rem] top-12 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(242,186,123,0.16),transparent_70%)] blur-2xl" />

          <nav className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-[28px] border border-white/10 bg-[rgba(8,14,26,0.82)] px-5 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
              <Link href="/" className="flex items-center gap-3">
                <div className="font-display flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f8dfb5_0%,#f2ba7b_100%)] text-sm font-semibold tracking-[0.2em] text-[#07101d] shadow-[0_14px_30px_rgba(242,186,123,0.28)]">
                  TH
                </div>
                <div>
                  <div className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-[var(--signal-sand)]">
                    THChat
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Competitor intelligence across SQL and RAG
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                {links.map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    className="font-display rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-foreground"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          <main className="mx-auto max-w-6xl px-4 pb-14 pt-8 sm:px-6 sm:pt-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
