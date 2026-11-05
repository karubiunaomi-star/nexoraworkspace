import { cn } from "@/lib/utils";
import { AURORA_BREAKPOINT, PANE_LIMITS } from "@/nexora/layout";
import { NexoraEmblem } from "@/nexora/NexoraEmblem";
import type { NexoraController } from "@/nexora/useNexora";
import { useNexora } from "@/nexora/useNexora";
import { useMediaQuery } from "@/nexora/useMediaQuery";
import type { NexoraTask } from "@/nexora/types";
import { ENG_TABS, EngineeringLayout } from "@/workspace/EngineeringPanes";
import { LEARNING_TABS, LearningLayout } from "@/workspace/LearningPanes";
import {
  ChevronDown,
  Code2,
  GitBranch,
  GraduationCap,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

type LayoutMode = "learning" | "engineering";

const RAIL = [
  { id: "learning" as const, label: "Learning", icon: GraduationCap },
  { id: "engineering" as const, label: "Engineering", icon: Code2 },
];

const COMPACT_QUERY = `(max-width: ${AURORA_BREAKPOINT - 1}px)`;

function taskStateLabel(task: NexoraTask | null) {
  if (!task) return "IDLE";
  const states: Record<NexoraTask["status"], string> = {
    proposed: "PROPOSED · AWAITING FOUNDER APPROVAL",
    approved: "APPROVED · READY TO APPLY",
    applied: "APPLIED TO WORKSPACE BUFFER",
    rejected: "REJECTED · NO EXECUTION",
  };
  return states[task.status];
}

function WorkspaceMark({ className }: { className?: string }) {
  return <NexoraEmblem className={cn("size-7", className)} />;
}

export function WorkspaceStatusBar({
  controller,
}: {
  controller: NexoraController;
}) {
  const task = controller.activeTask;
  return (
    <footer
      data-window-statusbar
      role="status"
      className="flex h-6 shrink-0 items-center justify-between gap-3 overflow-hidden border-t border-[var(--a-line)] bg-[#0b1120] px-2.5 font-mono text-[9.5px] text-[var(--a-muted)]"
      style={{ height: 24 }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            task?.status === "applied"
              ? "bg-[#34d399]"
              : task?.status === "approved"
                ? "bg-[#8b5cf6]"
                : task?.status === "rejected"
                  ? "bg-[#f87171]"
                  : task?.status === "proposed"
                    ? "bg-[#fbbf24]"
                    : "bg-[#64748b]",
          )}
        />
        <span className="truncate">{taskStateLabel(task)}</span>
      </div>
      <div className="flex min-w-0 shrink items-center gap-2">
        <span className="hidden shrink-0 text-[var(--a-muted)]/70 sm:inline">TASK</span>
        <span className="shrink-0 text-[var(--a-mint)]/85">
          {controller.data.taskCode}
        </span>
        <span className="h-2.5 w-px shrink-0 bg-[var(--a-line)]" />
        <span className="truncate text-[var(--a-muted)]/80">
          {controller.data.workspacePath}
        </span>
      </div>
      <div className="hidden shrink-0 items-center gap-1.5 md:flex">
        {controller.mode === "founder" ? (
          <ShieldCheck className="size-2.5 text-[var(--a-mint)]/80" />
        ) : (
          <LockKeyhole className="size-2.5 text-[var(--a-muted)]" />
        )}
        <span>
          {controller.mode === "founder"
            ? controller.syncing
              ? "SYNCING"
              : "LIVE"
            : "GUEST · LOCAL"}
        </span>
      </div>
    </footer>
  );
}

export function NexoraWorkspace({ isWindowActive = true }: { isWindowActive?: boolean }) {
  const controller = useNexora();
  const compact = useMediaQuery(COMPACT_QUERY);
  const [layout, setLayout] = useState<LayoutMode>("engineering");
  const [learningPane, setLearningPane] = useState<string>("conversation");
  const [engineeringPane, setEngineeringPane] = useState<string>("code");
  const [selectedFile, setSelectedFile] = useState("src/nexora/layout.ts");
  const paneAreaRef = useRef<HTMLDivElement>(null);

  const switchLayout = useCallback((next: LayoutMode) => {
    setLayout(next);
    if (next === "learning") setLearningPane("conversation");
    else setEngineeringPane("code");
  }, []);

  const openEngineering = useCallback(() => {
    setLayout("engineering");
    setEngineeringPane("ai");
  }, []);

  const tabs = layout === "learning" ? LEARNING_TABS : ENG_TABS;
  const activeTab = layout === "learning" ? learningPane : engineeringPane;
  const setActiveTab = layout === "learning" ? setLearningPane : setEngineeringPane;

  const paneProps = { controller, compact };
  const task = controller.activeTask;
  const live = controller.mode === "founder";

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col bg-[#090d16]",
        !isWindowActive && "opacity-[0.98]",
      )}
    >
      {/* Freebuff-style project header */}
      <header
        data-workspace-header
        className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-[var(--a-line)] bg-[#111827] px-2.5"
      >
        <div className="flex min-w-0 items-center gap-2">
          <WorkspaceMark />
          <div className="flex min-w-0 items-baseline gap-1.5">
            <span className="shrink-0 text-[12.5px] font-semibold tracking-[-0.01em] text-[var(--a-text)]">
              Nexora
            </span>
            <span className="hidden shrink-0 text-[12px] text-[var(--a-muted)] sm:inline">
              Workspace
            </span>
            <span className="hidden shrink-0 font-mono text-[8px] tracking-[0.2em] text-[var(--a-ice)]/80 uppercase xl:inline">
              Omega
            </span>
          </div>
          <span className="mx-1 h-4 w-px shrink-0 bg-[var(--a-line)]" />
          <span className="hidden shrink-0 items-center gap-1.5 rounded-md border border-[var(--a-line)] bg-white/[0.025] px-2 py-1 text-[11px] text-[var(--a-text)]/85 md:inline-flex">
            <GitBranch className="size-3 text-[var(--a-muted)]" />
            main
            <ChevronDown className="size-3 text-[var(--a-muted)]" />
          </span>
          <span className="hidden min-w-0 truncate text-[11.5px] text-[var(--a-muted)] lg:inline">
            {task ? `${task.code} · ${task.title}` : controller.data.workspacePath}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span className="hidden items-center gap-1.5 rounded-md border border-[var(--a-line)] px-2 py-1 text-[11px] text-[var(--a-muted)] sm:flex">
            <Users className="size-3" />
            Members
            <span className="text-[var(--a-text)]/80">1</span>
          </span>
          <span className="hidden items-center gap-1.5 rounded-md border border-[var(--a-line)] px-2 py-1 text-[10.5px] text-[var(--a-muted)] md:flex">
            <span
              className={cn(
                "size-1.5 rounded-full",
                live ? "bg-[#22d3ee]" : "bg-[#64748b]",
              )}
            />
            {controller.syncing ? "Syncing" : live ? "Live" : "Local"}
          </span>
          <button
            type="button"
            onClick={openEngineering}
            className="aurora-cta aurora-focus flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-semibold"
          >
            <Sparkles className="size-3" />
            <span className="hidden sm:inline">Review patch</span>
            <span className="sm:hidden">Review</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* exactly two rail items */}
        <nav
          aria-label="Nexora workspace sections"
          className="flex shrink-0 flex-col items-center justify-between border-r border-[var(--a-line)] bg-[#0b1120] py-2"
          style={{ width: PANE_LIMITS.rail }}
        >
          <div className="flex w-full flex-col items-center gap-1 px-1.5">
            {RAIL.map((item) => {
              const active = layout === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-rail-item={item.id}
                  aria-current={active ? "page" : undefined}
                  onClick={() => switchLayout(item.id)}
                  className={cn(
                    "aurora-focus aurora-railtab flex w-full flex-col items-center gap-1.5 rounded-md px-1 py-2.5",
                    active &&
                      (item.id === "learning"
                        ? "aurora-railtab-active-violet"
                        : "aurora-railtab-active"),
                  )}
                  title={`${item.label} layout`}
                >
                  <item.icon className="size-[17px]" strokeWidth={1.8} />
                  <span className="text-[8.5px] font-medium tracking-[0.06em] uppercase">
                    {item.id === "engineering" ? "Eng" : "Learn"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col items-center gap-2 pb-1">
            <span className="h-5 w-px bg-[var(--a-line)]" />
            <div
              className="flex flex-col items-center gap-1"
              title={
                live
                  ? "Server-authorized founder session"
                  : "Guest preview: actions are local only"
              }
            >
              {live ? (
                <ShieldCheck className="size-3.5 text-[var(--a-mint)]/80" />
              ) : (
                <LockKeyhole className="size-3.5 text-[var(--a-muted)]" />
              )}
              <span
                className={cn(
                  "text-[8px] font-medium tracking-[0.08em] uppercase",
                  live ? "text-[var(--a-mint)]/70" : "text-[var(--a-muted)]/80",
                )}
              >
                {live ? "Live" : "Local"}
              </span>
            </div>
          </div>
        </nav>

        <div
          ref={paneAreaRef}
          data-pane-area
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        >
          {compact ? (
            <div
              role="tablist"
              aria-label="Workspace panes"
              className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-[var(--a-line)] bg-[#0b1120] px-2 py-1.5"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  data-pane-tab={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "aurora-focus shrink-0 rounded-md border border-transparent px-2.5 py-1 text-[11.5px] font-medium",
                    activeTab === tab.id
                      ? "bg-white/[0.06] text-[var(--a-text)]"
                      : "text-[var(--a-muted)]",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-hidden">
            {layout === "learning" ? (
              <LearningLayout
                {...paneProps}
                activePane={learningPane}
                onOpenEngineering={openEngineering}
              />
            ) : (
              <EngineeringLayout
                {...paneProps}
                activePane={engineeringPane}
                selectedFile={selectedFile}
                onSelectFile={setSelectedFile}
              />
            )}
          </div>
        </div>
      </div>
      <WorkspaceStatusBar controller={controller} />
    </div>
  );
}
