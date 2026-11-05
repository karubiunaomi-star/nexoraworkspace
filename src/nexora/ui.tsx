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
    <div className="aurora-pane-head flex h-11 shrink-0 items-center justify-between gap-3 px-3">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="size-3.5 shrink-0 text-[var(--a-muted)]" strokeWidth={1.8} />
        <span className="shrink-0 text-[12px] font-medium text-[var(--a-text)]">{label}</span>
        {hint ? (
          <span className="truncate font-mono text-[10.5px] text-[var(--a-muted)]/80">
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
        "flex h-11 shrink-0 items-center gap-1 overflow-x-auto border-b border-[var(--a-line)] bg-[#0d0d0f] px-2",
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
              "aurora-focus flex shrink-0 items-center gap-1.5 rounded-md border border-transparent px-2.5 py-1.5 text-[12px] font-medium transition-colors",
              active
                ? "aurora-tab-active"
                : "text-[var(--a-muted)] hover:bg-white/[0.035] hover:text-[var(--a-text)]",
            )}
          >
            {tab.label}
            {typeof tab.count === "number" ? (
              <span className="rounded-full bg-white/[0.07] px-1.5 text-[9.5px] font-normal tabular-nums">
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
  indexed: "border-[#8fe3aa]/25 bg-[#8fe3aa]/10 text-[#a8edbc]",
  "read-only": "border-white/10 bg-white/[0.04] text-[#a3a3a8]",
  attached: "border-[#f0cf8e]/25 bg-[#f0cf8e]/10 text-[#f2d9a4]",
  unverified: "border-[#f0cf8e]/25 bg-[#f0cf8e]/10 text-[#f2d9a4]",
  cached: "border-[#a9bde8]/25 bg-[#a9bde8]/10 text-[#c4d3f2]",
  unavailable: "border-[#ff9a8b]/25 bg-[#ff9a8b]/10 text-[#ffb3a8]",
  proposed: "border-[#f0cf8e]/25 bg-[#f0cf8e]/10 text-[#f2d9a4]",
  approved: "border-[#a9bde8]/25 bg-[#a9bde8]/10 text-[#c4d3f2]",
  applied: "border-[#8fe3aa]/25 bg-[#8fe3aa]/10 text-[#a8edbc]",
  rejected: "border-[#ff9a8b]/25 bg-[#ff9a8b]/10 text-[#ffb3a8]",
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
        "inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 font-mono text-[9px] tracking-[0.08em] uppercase",
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
            <span className="sticky left-0 w-10 shrink-0 select-none border-r border-[var(--a-line)] bg-[#0b0b0d] pr-2 text-right text-[9px] leading-[1.95] text-[#64646a]">
              {startLine + index}
            </span>
            <span className="whitespace-pre px-3 text-[#d5d5d2]">{line || " "}</span>
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
