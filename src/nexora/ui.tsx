import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { AttachmentStatus, TaskStatus } from "./types";

export function formatTime(value: number) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatWhen(value: number) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PaneHeader({
  icon: Icon,
  label,
  hint,
  right,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  right?: ReactNode;
}) {
  return (
    <div className="aurora-pane-head flex h-10 shrink-0 items-center justify-between gap-3 px-3">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="size-3.5 shrink-0 text-[var(--a-mint)]/80" strokeWidth={1.7} />
        <span className="aurora-label shrink-0 text-[var(--a-text)]/80">{label}</span>
        {hint ? (
          <span className="truncate font-mono text-[10px] text-[var(--a-muted)]">
            {hint}
          </span>
        ) : null}
      </div>
      {right ? <div className="flex shrink-0 items-center gap-2">{right}</div> : null}
    </div>
  );
}

export function TabBar<T extends string>({
  tabs,
  value,
  onChange,
  className,
  ariaLabel,
}: {
  tabs: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  ariaLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex shrink-0 items-center gap-1 overflow-x-auto border-b border-[var(--a-line)] px-2 py-1.5",
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            data-pane-tab={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "aurora-focus flex shrink-0 items-center gap-1.5 rounded-sm border border-transparent px-2 py-1 font-mono text-[10px] tracking-[0.08em] uppercase transition-colors",
              active
                ? "aurora-tab-active"
                : "text-[var(--a-muted)] hover:bg-white/[0.04] hover:text-[var(--a-text)]",
            )}
          >
            {tab.label}
            {typeof tab.count === "number" ? (
              <span className="rounded-sm bg-white/[0.07] px-1 text-[9px] tabular-nums">
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

const statusTone: Record<string, string> = {
  indexed: "border-[#7ee7c7]/30 bg-[#7ee7c7]/10 text-[#a5f3df]",
  "read-only": "border-white/10 bg-white/[0.04] text-[#9fb9b5]",
  attached: "border-[#e8c37a]/30 bg-[#e8c37a]/10 text-[#f0d5a2]",
  unverified: "border-[#e8c37a]/30 bg-[#e8c37a]/10 text-[#f0d5a2]",
  cached: "border-[#9fd8e8]/25 bg-[#9fd8e8]/10 text-[#c3e8f2]",
  unavailable: "border-[#ff8a7a]/30 bg-[#ff8a7a]/10 text-[#ffb3a8]",
  proposed: "border-[#e8c37a]/30 bg-[#e8c37a]/10 text-[#f0d5a2]",
  approved: "border-[#9fd8e8]/30 bg-[#9fd8e8]/10 text-[#c3e8f2]",
  applied: "border-[#8be6b0]/30 bg-[#8be6b0]/10 text-[#b6f5cc]",
  rejected: "border-[#ff8a7a]/30 bg-[#ff8a7a]/10 text-[#ffb3a8]",
};

export function StatusChip({
  value,
  className,
  dot = true,
}: {
  value: AttachmentStatus | TaskStatus | string;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 font-mono text-[9px] tracking-[0.1em] uppercase",
        statusTone[value] ?? "border-white/10 bg-white/[0.04] text-[var(--a-muted)]",
        className,
      )}
    >
      {dot ? <span className="size-1 rounded-full bg-current opacity-80" /> : null}
      {value}
    </span>
  );
}

export function Divider({
  axis,
  onPointerDown,
  label,
}: {
  axis: "x" | "y";
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  label: string;
}) {
  return (
    <div
      role="separator"
      aria-orientation={axis === "x" ? "vertical" : "horizontal"}
      aria-label={label}
      data-divider={axis}
      onPointerDown={onPointerDown}
      className={cn(
        "aurora-divider",
        axis === "x" ? "aurora-divider-x w-1.5 cursor-col-resize" : "aurora-divider-y h-1.5 cursor-row-resize",
      )}
    />
  );
}

export function CodeView({
  content,
  highlight,
  startLine = 1,
  emptyLabel,
}: {
  content: string;
  highlight?: { from: number; to: number; tone: "added" | "removed" } | null;
  startLine?: number;
  emptyLabel?: string;
}) {
  const lines = content.replace(/\n$/, "").split("\n");
  if (!content.trim()) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center font-mono text-[10px] text-[var(--a-muted)]">
        {emptyLabel ?? "No content"}
      </div>
    );
  }
  return (
    <pre className="aurora-mono min-w-full w-max text-[11px] leading-[1.65]">
      <code className="block">
        {lines.map((line, index) => (
          <span
            key={`${index}-${line.slice(0, 12)}`}
            className={cn(
              "flex min-w-full",
              highlight &&
                index >= highlight.from &&
                index <= highlight.to &&
                (highlight.tone === "added" ? "aurora-diff-add" : "aurora-diff-remove"),
            )}
          >
            <span className="sticky left-0 w-10 shrink-0 select-none border-r border-[var(--a-line)] bg-[#061113] pr-2 text-right text-[9px] leading-[1.95] text-[var(--a-muted)]/60">
              {startLine + index}
            </span>
            <span className="whitespace-pre px-3 text-[#c6dcd7]">{line || " "}</span>
          </span>
        ))}
      </code>
    </pre>
  );
}

export function DiffBlock({
  label,
  tone,
  code,
}: {
  label: string;
  tone: "before" | "after";
  code: string;
}) {
  const lines = code.replace(/\n$/, "").split("\n");
  const isBefore = tone === "before";
  return (
    <div className="overflow-hidden rounded-sm border border-[var(--a-line)]">
      <div className="flex items-center justify-between border-b border-[var(--a-line)] bg-white/[0.02] px-2.5 py-1.5">
        <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.18em] uppercase">
          <span
            className={cn(
              "size-1.5 rounded-full",
              isBefore ? "bg-[#ff8a7a]" : "bg-[#8be6b0]",
            )}
          />
          <span className={isBefore ? "text-[#ffb3a8]" : "text-[#b6f5cc]"}>{label}</span>
        </span>
        <span className="font-mono text-[9px] text-[var(--a-muted)]">
          {lines.length} lines
        </span>
      </div>
      <div className={cn("aurora-mono overflow-x-auto py-1.5 text-[10.5px] leading-[1.65]", isBefore ? "aurora-diff-remove" : "aurora-diff-add")}>
        {lines.map((line, index) => (
          <div key={`${tone}-${index}`} className="flex px-2">
            <span className="w-5 shrink-0 select-none text-[10px] opacity-45">
              {isBefore ? "−" : "+"}
            </span>
            <span className={cn("whitespace-pre", isBefore ? "text-[#e8b3aa]" : "text-[#b9e8c9]")}>
              {line || " "}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function KeyValue({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.05] py-2 last:border-0">
      <span className="aurora-label text-[8.5px]">{k}</span>
      <span className="text-right font-mono text-[10px] text-[var(--a-text)]/90">{v}</span>
    </div>
  );
}
