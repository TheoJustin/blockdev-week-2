'use client';

import { useState } from 'react';
import { ChatbotRagWidget } from '@theojustin/chatbot-rag-widget';
import {
  SignalBadge,
  SignalFeatureCard,
  SignalPageIntro,
} from '@/components/signal/primitives';
import { BookOpenText, Loader2, Radar, Sparkles } from 'lucide-react';

export default function RagChatPage() {
  const [isThinking, setIsThinking] = useState(false);

  const handleMessage = async (message: string): Promise<string> => {
    setIsThinking(true);

    try {
      const response = await fetch('/api/rag-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error communicating with RAG API:', error);
      return 'Sorry, I encountered an error searching the knowledge base.';
    } finally {
      setIsThinking(false);
    }
  };

  const prompts = [
    'What mechanics make PUBG strategically tense according to the uploaded report?',
    'Which passages discuss positive reinforcement loops or battle pass systems?',
    'What does the source text say about map pressure and player conflict?',
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-4 reveal">
        <SignalPageIntro
          badgeIcon={Sparkles}
          badgeLabel="Retrieval Chat"
          accentBadge
          title="Ask narrative questions that need raw document evidence."
          description={
            <>
          Unlike the SQL assistant, this view searches Pinecone chunks from your
          uploaded PDFs and builds answers from the top retrieved passages.
            </>
          }
          titleClassName="max-w-sm"
        />

        <div className="signal-panel rounded-[28px] p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--signal-cyan)]">
            <Radar className="h-3.5 w-3.5" />
            Good prompt shapes
          </div>
          <div className="mt-4 space-y-3">
            {prompts.map((prompt) => (
              <SignalFeatureCard
                key={prompt}
                description={prompt}
                className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3"
              />
            ))}
          </div>
        </div>

        <SignalFeatureCard
          icon={BookOpenText}
          eyebrow="Retrieval notes"
          description={
            <>
              <span className="block">The current retriever pulls the top 5 chunks for each question.</span>
              <span className="mt-2 block">If the answer is not in the retrieved context, the assistant should say so instead of guessing.</span>
              <span className="mt-2 block">Use the RAG Eval page when you want to score the retriever itself.</span>
            </>
          }
          tone="blue"
          className="rounded-[28px] p-5"
        />
      </aside>

      <div className="signal-panel rounded-[32px] p-6 reveal" style={{ animationDelay: '120ms' }}>
        <div className="flex flex-col gap-5 border-b border-white/[0.08] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--signal-cyan)]">
                Pinecone-backed search
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
                Competitor Document Q&amp;A
              </h1>
            </div>
            <SignalBadge label="Top 5 chunk retrieval" />
          </div>

          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Use this mode when the answer is buried in prose, examples, or
            nuance that would be flattened by a structured table.
          </p>

          {isThinking && (
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--signal-cyan)]" />
              Searching the knowledge base...
            </div>
          )}
        </div>

        <div className="mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <ChatbotRagWidget
            onSendMessage={handleMessage}
            title="RAG Assistant"
            placeholder="e.g. What loyalty signals show up in the strategy segment?"
            initialMessage="I’ve indexed the uploaded competitor documents. Ask me something that needs source-grounded retrieval."
            className="rag-widget-reset"
          />
        </div>
      </div>
    </div>
  );
}
