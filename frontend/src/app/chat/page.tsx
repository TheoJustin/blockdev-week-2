'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import { DefaultChatTransport, type ToolUIPart, type UIMessage } from 'ai';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  SignalBadge,
  SignalFeatureCard,
  SignalIconBadge,
  SignalPageIntro,
} from '@/components/signal/primitives';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Bot,
  Database,
  Loader2,
  Send,
  Sparkles,
  User,
} from 'lucide-react';

type QueryPostgresInput = { query: string };
type QueryPostgresOutput = Record<string, unknown>[] | { error: string };

type QueryPostgresToolPart = ToolUIPart<{
  query_postgres: {
    input: QueryPostgresInput;
    output: QueryPostgresOutput;
  };
}>;

type ToolPartState = QueryPostgresToolPart['state'];

const RUNNING_STATES: ToolPartState[] = ['input-streaming', 'input-available'];
const SUGGESTIONS = [
  'Compare Google Meet, Microsoft Teams, and Zoom based on extracted rows.',
  'Which competitors mention recording, chat, or document sharing?',
  'Show pricing and participant-limit rows from the uploaded reports.',
];

function QueryPostgresPart({ part }: { part: QueryPostgresToolPart }) {
  const isRunning = RUNNING_STATES.includes(part.state);

  return (
    <div className="mb-3 rounded-[18px] border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        {isRunning ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--signal-cyan)]" />
            Executing PostgreSQL query...
          </>
        ) : (
          <>
            <Database className="h-3.5 w-3.5 text-[var(--signal-amber)]" />
            Query complete. Answer is based on returned rows only.
          </>
        )}
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <SignalIconBadge icon={Bot} tone="cyan" className="h-10 w-10" />
      )}

      <div
        className={`max-w-[85%] rounded-[24px] px-4 py-3 text-sm leading-7 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ${
          isUser
            ? 'bg-[linear-gradient(135deg,#f8dfb5_0%,#f2ba7b_100%)] text-[#07101d]'
            : 'border border-white/10 bg-white/[0.04] text-foreground backdrop-blur-xl'
        }`}
      >
        {message.parts.map((part, index) => {
          if (part.type === 'text') {
            return (
              <ReactMarkdown
                key={index}
                components={{
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong
                      className={isUser ? 'font-semibold text-[#07101d]' : 'font-semibold text-[var(--signal-sand)]'}
                    >
                      {children}
                    </strong>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>
                  ),
                  li: ({ children }) => <li>{children}</li>,
                  code: ({ children }) => (
                    <code
                      className={`rounded px-1.5 py-0.5 font-mono text-xs ${
                        isUser
                          ? 'bg-black/12 text-[#07101d]'
                          : 'bg-white/[0.08] text-[var(--signal-sand)]'
                      }`}
                    >
                      {children}
                    </code>
                  ),
                }}
              >
                {part.text}
              </ReactMarkdown>
            );
          }

          if (part.type === 'tool-query_postgres') {
            return (
              <QueryPostgresPart
                key={index}
                part={part as QueryPostgresToolPart}
              />
            );
          }

          return null;
        })}
      </div>

      {isUser && (
        <SignalIconBadge icon={User} tone="amber" className="h-10 w-10" />
      )}
    </div>
  );
}

export default function ChatPage() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const isLoading = status === 'submitted' || status === 'streaming';
  const lastMessage = messages.at(-1);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text: string) => {
    if (!text.trim() || isLoading) {
      return;
    }

    sendMessage({ text });
    setInput('');
  };

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleSend(input);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-4 reveal">
        <SignalPageIntro
          badgeIcon={Sparkles}
          badgeLabel="SQL Analyst"
          accentBadge
          title="Ask exact competitor questions against structured data."
          description={
            <>
          This assistant uses the normalized `competitor_analysis` table, not
          free-form document recall. It writes a `SELECT`, runs it, and answers
          from returned rows only.
            </>
          }
          titleClassName="max-w-sm"
        />

        <div className="signal-panel rounded-[28px] p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--signal-cyan)]">
            Quick prompts
          </div>
          <div className="mt-4 space-y-3">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSend(suggestion)}
                disabled={isLoading}
                className="w-full rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm leading-6 text-muted-foreground transition hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-foreground disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <SignalFeatureCard
          eyebrow="Under the hood"
          description={
            <>
              <span className="block">1. The model drafts a PostgreSQL `SELECT` query.</span>
              <span className="mt-2 block">2. The tool executes that query against your competitor table.</span>
              <span className="mt-2 block">3. The final answer stays grounded in the returned rows.</span>
            </>
          }
          tone="blue"
          className="rounded-[28px] p-5"
        />
      </aside>

      <Card className="signal-panel flex min-h-[80vh] flex-col rounded-[32px] text-foreground reveal">
        <CardHeader className="border-b border-white/[0.08] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl font-semibold tracking-[-0.04em]">
                <SignalIconBadge icon={Database} tone="amber" />
                NL-to-SQL Assistant
              </CardTitle>
              <CardDescription className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Ask for comparisons, trends, and specific feature lookups. The
                assistant should stay faithful to what is actually stored in the
                database.
              </CardDescription>
            </div>
            <SignalBadge label="Structured evidence only" />
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col bg-transparent pt-6">
          <div className="flex-1 space-y-5 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-[28px] border border-dashed border-white/[0.12] bg-white/[0.03] px-6 py-12 text-center">
                <Bot className="mb-4 h-12 w-12 text-[var(--signal-cyan)]" />
                <p className="text-lg font-semibold tracking-[-0.03em] text-foreground">
                  Start with a precise question.
                </p>
                <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
                  Try asking about participant limits, pricing tiers, specific
                  capabilities, or which competitors mention a certain feature.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}

            {isLoading && lastMessage?.role === 'user' && (
              <div className="flex justify-start gap-4">
                <SignalIconBadge icon={Bot} tone="cyan" className="h-10 w-10" />
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking through the database...
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="mt-6 border-t border-white/[0.08] pt-5">
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about platforms, plans, pricing, or feature comparisons..."
                className="h-[52px] rounded-[22px] border-white/10 bg-white/[0.04] px-5"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                size="icon-lg"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
