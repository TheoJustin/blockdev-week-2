import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type SignalTone = 'amber' | 'blue' | 'cyan' | 'sand' | 'foreground';

const toneClasses: Record<SignalTone, string> = {
  amber: 'text-[var(--signal-amber)]',
  blue: 'text-[var(--signal-blue)]',
  cyan: 'text-[var(--signal-cyan)]',
  sand: 'text-[var(--signal-sand)]',
  foreground: 'text-foreground',
};

function withRevealDelay(delayMs?: number) {
  if (delayMs === undefined) {
    return undefined;
  }

  return { animationDelay: `${delayMs}ms` };
}

export function SignalBadge({
  icon: Icon,
  label,
  accent = false,
  className,
}: {
  icon?: LucideIcon;
  label: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn('signal-chip', accent && 'signal-chip-accent', className)}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {label}
    </div>
  );
}

export function SignalIconBadge({
  icon: Icon,
  tone = 'amber',
  className,
}: {
  icon: LucideIcon;
  tone?: SignalTone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]',
        toneClasses[tone],
        className,
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

export function SignalPageIntro({
  badgeIcon,
  badgeLabel,
  title,
  description,
  accentBadge = false,
  className,
  titleClassName,
  descriptionClassName,
}: {
  badgeIcon?: LucideIcon;
  badgeLabel: string;
  title: string;
  description: ReactNode;
  accentBadge?: boolean;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      <SignalBadge
        icon={badgeIcon}
        label={badgeLabel}
        accent={accentBadge}
      />
      <h1
        className={cn(
          'font-display max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-[var(--signal-sand)] sm:text-5xl',
          titleClassName,
        )}
      >
        {title}
      </h1>
      <p
        className={cn(
          'max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base',
          descriptionClassName,
        )}
      >
        {description}
      </p>
    </div>
  );
}

export function SignalFeatureCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  tone = 'cyan',
  className,
  revealDelayMs,
}: {
  icon?: LucideIcon;
  eyebrow?: string;
  title?: string;
  description: ReactNode;
  tone?: SignalTone;
  className?: string;
  revealDelayMs?: number;
}) {
  return (
    <div
      className={cn('signal-panel-soft rounded-[24px] p-4', className)}
      style={withRevealDelay(revealDelayMs)}
    >
      {Icon ? (
        <div className="flex items-start gap-4">
          <SignalIconBadge icon={Icon} tone={tone} />
          <div className="space-y-2">
            {eyebrow ? (
              <div
                className={cn(
                  'font-display text-xs uppercase tracking-[0.16em]',
                  toneClasses[tone],
                )}
              >
                {eyebrow}
              </div>
            ) : null}
            {title ? (
              <div className="font-display text-lg font-semibold tracking-[-0.03em] text-foreground">
                {title}
              </div>
            ) : null}
            <p className="text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      ) : (
        <div>
          {eyebrow ? (
            <div
              className={cn(
                'font-display mb-2 text-xs uppercase tracking-[0.16em]',
                toneClasses[tone],
              )}
            >
              {eyebrow}
            </div>
          ) : null}
          {title ? (
            <div className="font-display text-lg font-semibold tracking-[-0.03em] text-foreground">
              {title}
            </div>
          ) : null}
          <p
            className={cn(
              'text-sm leading-6 text-muted-foreground',
              title && 'mt-2',
            )}
          >
            {description}
          </p>
        </div>
      )}
    </div>
  );
}

export function SignalValueCard({
  eyebrow,
  value,
  helper,
  tone = 'cyan',
  className,
  revealDelayMs,
}: {
  eyebrow: string;
  value: ReactNode;
  helper: ReactNode;
  tone?: SignalTone;
  className?: string;
  revealDelayMs?: number;
}) {
  return (
    <div
      className={cn('signal-panel-soft rounded-[26px] p-4', className)}
      style={withRevealDelay(revealDelayMs)}
    >
      <div
        className={cn(
          'font-display text-xs uppercase tracking-[0.16em]',
          toneClasses[tone],
        )}
      >
        {eyebrow}
      </div>
      <div className="font-display mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">
        {value}
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{helper}</p>
    </div>
  );
}

export function SignalCallout({
  icon: Icon,
  children,
  tone = 'cyan',
  className,
}: {
  icon?: LucideIcon;
  children: ReactNode;
  tone?: SignalTone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-muted-foreground',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {Icon ? <Icon className={cn('h-4 w-4', toneClasses[tone])} /> : null}
        {children}
      </div>
    </div>
  );
}
