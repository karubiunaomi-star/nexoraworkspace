import { cn } from "@/lib/utils";
import { AURORA_BREAKPOINT, PANE_LIMITS } from "@/nexora/layout";
import type { NexoraController } from "@/nexora/useNexora";
import { useNexora } from "@/nexora/useNexora";
import { useMediaQuery } from "@/nexora/useMediaQuery";
import type { NexoraTask } from "@/nexora/types";
import { ENG_TABS, EngineeringLayout } from "@/workspace/EngineeringPanes";
import { LEARNING_TABS, LearningLayout } from "@/workspace/LearningPanes";
import {
  Code2,
  GraduationCap,
  LockKeyhole,
  ShieldCheck,
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
      className="flex h-6 shrink-0 items-center justify-between gap-3 overflow-hidden border-t border-[var(--a-line)] bg-[#050f11] px-2.5 font-mono text-[9px] tracking-[0.06em] text-[var(--a-muted)]"
      style={{ height: 24 }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            task?.status === "applied"
              ? "bg-[#8be6b0]"
              : task?.status === "approved"
                ? "bg-[#9fd8e8]"
                : task?.status === "rejected"
                  ? "bg-[#ff8a7a]"
                  : "bg-[#e8c37a]",
          )}
        />
        <span className="truncate uppercase">{taskStateLabel(task)}</span>
      </div>
      <div className="flex min-w-0 shrink items-center gap-2">
        <span className="hidden shrink-0 text-[var(--a-text)]/60 sm:inline">
          TASK
        </span>
        <span className="shrink-0 text-[var(--a-mint)]/85">
          {controller.data.taskCode}
        </span>
        <span className="h-2.5 w-px shrink-0 bg-[var(--a-line)]" />
        <span className="truncate text-[var(--a-text)]/55">
          {controller.data.workspacePath}
        </span>
      </div>
      <div className="hidden shrink-0 items-center gap-1.5 md:flex">
        {controller.mode === "founder" ? (
          <ShieldCheck className="size-2.5 text-[var(--a-mint)]/80" />
        ) : (
          <LockKeyhole className="size-2.5 text-[var(--a-amber)]/80" />
        )}
        <span className="uppercase">
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

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col bg-[#050d0f]",
        !isWindowActive && "opacity-[0.98]",
      )}
    >
      <div className="flex min-h-0 flex-1">
        {/* exactly two rail items */}
        <nav
          aria-label="Nexora workspace sections"
          className="flex w-[60px] shrink-0 flex-col items-center justify-between border-r border-[var(--a-line)] bg-[#061113] py-2"
          style={{ width: PANE_LIMITS.rail }}
        >
          <div className="flex w-full flex-col items-center gap-1 px-1">
            <span className="aurora-label mb-1 text-[6.5px] text-[var(--a-muted)]/70">
              Mode
            </span>
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
                    "aurora-focus aurora-railtab flex w-full flex-col items-center gap-1 rounded-sm px-1 py-2.5",
                    active && "aurora-railtab-active",
                  )}
                  title={`${item.label} layout`}
                >
                  <item.icon className="size-4" strokeWidth={1.7} />
                  <span className="font-mono text-[6.5px] tracking-[0.12em] uppercase">
                    {item.id === "engineering" ? "ENG" : "LEARN"}
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
                controller.mode === "founder"
                  ? "Server-authorized founder session"
                  : "Guest preview: actions are local only"
              }
            >
              {controller.mode === "founder" ? (
                <ShieldCheck className="size-3 text-[var(--a-mint)]/70" />
              ) : (
                <LockKeyhole className="size-3 text-[var(--a-amber)]/70" />
              )}
              <span
                className={cn(
                  "font-mono text-[5.5px] tracking-[0.1em] uppercase",
                  controller.mode === "founder"
                    ? "text-[var(--a-mint)]/60"
                    : "text-[var(--a-amber)]/60",
                )}
              >
                {controller.mode === "founder" ? "Live" : "Local"}
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
              className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-[var(--a-line)] bg-[#071416] px-1.5 py-1.5"
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
                    "aurora-focus shrink-0 rounded-sm border px-2.5 py-1 font-mono text-[9px] tracking-[0.1em] uppercase",
                    activeTab === tab.id
                      ? "aurora-tab-active"
                      : "border-transparent text-[var(--a-muted)]",
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
