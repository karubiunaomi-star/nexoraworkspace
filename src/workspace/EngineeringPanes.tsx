import { Link } from "react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { WORKSPACE_FILES } from "@/nexora/files";
import { DEFAULT_SPLITS, PANE_LIMITS } from "@/nexora/layout";
import type { NexoraController } from "@/nexora/useNexora";
import type { NexoraTask } from "@/nexora/types";
import {
  CodeView,
  DiffBlock,
  Divider,
  KeyValue,
  PaneHeader,
  StatusChip,
  TabBar,
  formatTime,
  formatWhen,
} from "@/nexora/ui";
import {
  BadgeCheck,
  Bot,
  Check,
  ChevronRight,
  Code2,
  Database,
  FileCode2,
  FlaskConical,
  FolderTree,
  GitCompare,
  Loader2,
  LockKeyhole,
  PanelRight,
  Play,
  ScanLine,
  Send,
  ShieldCheck,
  Sparkles,
  SquareTerminal,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

export const ENG_TABS = [
  { id: "files", label: "Files" },
  { id: "code", label: "Code" },
  { id: "ai", label: "AI" },
  { id: "output", label: "Output" },
] as const;

type EngTab = "preview" | "build" | "tests" | "report";

const OUTPUT_TABS: { id: EngTab; label: string }[] = [
  { id: "preview", label: "Preview" },
  { id: "build", label: "Build" },
  { id: "tests", label: "Tests" },
  { id: "report", label: "Report" },
];

function addedRange(content: string) {
  const lines = content.split("\n");
  const start = lines.findIndex((line) => line.includes("export const DOCK_TELEMETRY"));
  if (start === -1) return null;
  let end = start;
  while (end < lines.length - 1 && !lines[end].includes("} as const;")) end += 1;
  return { from: start, to: end, tone: "added" as const };
}

function FilesPane({
  controller,
  selectedFile,
  onSelectFile,
}: {
  controller: NexoraController;
  selectedFile: string;
  onSelectFile: (path: string) => void;
}) {
  const task = controller.activeTask;
  const groups = Array.from(
    new Set(WORKSPACE_FILES.map((file) => file.path.split("/").slice(0, -1).join("/"))),
  ).sort();

  return (
    <div
      data-pane="files"
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[#061012]"
    >
      <PaneHeader
        icon={FolderTree}
        label="Files"
        hint={`${WORKSPACE_FILES.length}`}
        right={
          <span className="font-mono text-[7.5px] tracking-[0.12em] text-[var(--a-muted)] uppercase">
            ro
          </span>
        }
      />
      <div className="aurora-scroll flex-1 p-1.5">
        {groups.map((group) => (
          <div key={group} className="mb-2">
            <div className="flex items-center gap-1 px-1.5 py-1">
              <ChevronRight className="size-2.5 text-[var(--a-muted)]/60" />
              <span className="truncate font-mono text-[9px] text-[var(--a-muted)]">
                {group}/
              </span>
            </div>
            {WORKSPACE_FILES.filter((file) => file.path.startsWith(`${group}/`)).map(
              (file) => {
                const active = selectedFile === file.path;
                const pending =
                  task?.filePath === file.path && task.status !== "applied";
                return (
                  <button
                    key={file.path}
                    type="button"
                    data-file-path={file.path}
                    onClick={() => onSelectFile(file.path)}
                    className={cn(
                      "aurora-focus flex w-full items-center gap-1.5 rounded-sm px-1.5 py-1.5 text-left transition-colors",
                      active
                        ? "bg-[var(--a-mint)]/[0.08] text-[var(--a-mint)]"
                        : "text-[var(--a-text)]/70 hover:bg-white/[0.035] hover:text-[var(--a-text)]",
                    )}
                  >
                    <FileCode2 className="size-3 shrink-0 opacity-70" />
                    <span className="min-w-0 flex-1 truncate font-mono text-[10px]">
                      {file.path.split("/").pop()}
                    </span>
                    {pending ? (
                      <span
                        title="Patch proposed — approval required"
                        className="size-1.5 shrink-0 rounded-full bg-[var(--a-amber)]"
                      />
                    ) : null}
                  </button>
                );
              },
            )}
          </div>
        ))}
      </div>
      <div className="shrink-0 border-t border-[var(--a-line)] px-2 py-1.5 font-mono text-[7.5px] leading-relaxed tracking-[0.06em] text-[var(--a-muted)]/70">
        READ-ONLY SNAPSHOTS
        <br />
        {controller.data.workspacePath}
      </div>
    </div>
  );
}

function CodePane({
  controller,
  selectedFile,
}: {
  controller: NexoraController;
  selectedFile: string;
}) {
  const file = WORKSPACE_FILES.find((item) => item.path === selectedFile) ?? WORKSPACE_FILES[0];
  const task = controller.activeTask;
  const isTarget = task?.filePath === file.path;
  const patched = isTarget && task?.status === "applied";
  const content = patched && task ? file.content.replace(task.before, task.after) : file.content;
  const changed = content !== file.content;
  const highlight = changed ? addedRange(content) : null;
  const lineCount = content.split("\n").length;

  return (
    <div
      data-pane="code"
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[#050d0f]"
    >
      <PaneHeader
        icon={Code2}
        label="Code"
        hint={file.path}
        right={
          <div className="flex items-center gap-1.5">
            <span className="hidden font-mono text-[8px] text-[var(--a-muted)] sm:inline">
              {lineCount} ln
            </span>
            <span
              className={cn(
                "flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[7.5px] tracking-[0.1em] uppercase",
                patched
                  ? "border-[var(--a-mint)]/30 bg-[var(--a-mint)]/10 text-[var(--a-mint)]"
                  : "border-[var(--a-line)] text-[var(--a-muted)]",
              )}
            >
              {patched ? <Check className="size-2" /> : <LockKeyhole className="size-2" />}
              {patched ? "patched" : "read-only"}
            </span>
          </div>
        }
      />
      {isTarget && task?.status === "proposed" ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--a-amber)]/20 bg-[var(--a-amber)]/[0.05] px-2.5 py-1.5">
          <span className="flex items-center gap-1.5 font-mono text-[8.5px] tracking-[0.08em] text-[var(--a-amber)]/85 uppercase">
            <GitCompare className="size-3" />
            1 pending hunk · approval required
          </span>
          <span className="hidden font-mono text-[8px] text-[var(--a-muted)] sm:inline">
            review below
          </span>
        </div>
      ) : null}
      <div className="aurora-scroll aurora-code-surface flex-1">
        <CodeView content={content} highlight={highlight} />
      </div>
      <div className="flex shrink-0 items-center justify-between border-t border-[var(--a-line)] px-2.5 py-1.5 font-mono text-[8px] text-[var(--a-muted)]">
        <span className="truncate">{file.language}</span>
        <span className="flex items-center gap-1">
          {changed ? (
            <>
              <span className="size-1 rounded-full bg-[var(--a-mint)]" />
              in-app buffer · repository unchanged
            </>
          ) : (
            <>
              <LockKeyhole className="size-2.5" /> edits require approval
            </>
          )}
        </span>
      </div>
    </div>
  );
}

function EngineeringAiPane({ controller }: { controller: NexoraController }) {
  const task = controller.activeTask;
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      await controller.sendMessage(draft);
      setDraft("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Prompt failed.");
    } finally {
      setSending(false);
    }
  };

  const approve = async () => {
    if (!task) return;
    try {
      await controller.approveTask(task.code);
      toast.success(`${task.code} approved`, {
        description: "Approval recorded. Apply is now available.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Approval failed.");
    }
  };

  const apply = async () => {
    if (!task) return;
    try {
      await controller.applyTask(task.code);
      toast.success(`${task.code} applied to the workspace buffer`, {
        description: "The repository itself is unchanged; the action is audited.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Execution failed.");
    }
  };

  const reject = async () => {
    if (!task) return;
    try {
      await controller.rejectTask(task.code);
      toast("Change rejected", { description: `${task.code} will not be applied.` });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rejection failed.");
    }
  };

  const canApprove = task?.status === "proposed";
  const canApply = task?.status === "approved";
  const isApplied = task?.status === "applied";
  const isRejected = task?.status === "rejected";
  const messages = controller.data.messages.slice(-4);

  return (
    <div
      data-pane="ai"
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[#071214]"
    >
      <PaneHeader
        icon={Sparkles}
        label="AI + Plan"
        hint={task?.code ?? "engineering"}
        right={
          task ? (
            <StatusChip value={task.status} />
          ) : (
            <span className="font-mono text-[8px] text-[var(--a-muted)]">no task</span>
          )
        }
      />

      <div className="aurora-scroll flex-1 p-2.5">
        <div className="space-y-2">
          {messages.map((message) => (
            <div
              key={`eng-${message.id}`}
              className={cn(
                "rounded-sm border px-2 py-1.5 text-[10.5px] leading-relaxed",
                message.role === "assistant"
                  ? "border-[var(--a-line)] bg-[var(--a-mint)]/[0.025] text-[var(--a-text)]/85"
                  : "border-[var(--a-amber)]/15 bg-[var(--a-amber)]/[0.035] text-[var(--a-text)]/80",
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 font-mono text-[7.5px] tracking-[0.14em] uppercase">
                  {message.role === "assistant" ? (
                    <>
                      <Bot className="size-2.5 text-[var(--a-mint)]/80" />
                      <span className="text-[var(--a-mint)]/75">plan engine</span>
                    </>
                  ) : (
                    <>
                      <span className="size-1.5 rounded-full bg-[var(--a-amber)]/60" />
                      <span className="text-[var(--a-amber)]/75">founder</span>
                    </>
                  )}
                </span>
                <span className="font-mono text-[7.5px] text-[var(--a-muted)]/60">
                  {formatTime(message.at)}
                </span>
              </div>
              <p className="line-clamp-4 whitespace-pre-wrap">{message.content}</p>
            </div>
          ))}
        </div>

        {task ? (
          <div className="mt-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="aurora-label">Plan</span>
              <span className="font-mono text-[8px] text-[var(--a-muted)]">
                {task.proposedBy}
              </span>
            </div>
            <ol className="space-y-1">
              {task.plan.map((step, index) => (
                <li
                  key={step}
                  className="flex items-start gap-1.5 text-[10px] leading-relaxed text-[var(--a-muted)]"
                >
                  <span className="mt-px flex size-3.5 shrink-0 items-center justify-center rounded-sm border border-[var(--a-line)] font-mono text-[7px] text-[var(--a-mint)]/80">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>

            <div className="flex items-center gap-1.5 font-mono text-[8px] text-[var(--a-muted)]">
              <FileCode2 className="size-2.5 text-[var(--a-mint)]/60" />
              {task.filePath}
              <span className="text-[var(--a-muted)]/50">·</span>
              1 hunk
            </div>

            <DiffBlock label="Before" tone="before" code={task.before} />
            <DiffBlock label="After" tone="after" code={task.after} />

            <div className="rounded-sm border border-[var(--a-line)] bg-white/[0.015] p-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-mono text-[8px] tracking-[0.14em] uppercase">
                  <ShieldCheck className="size-3 text-[var(--a-mint)]/80" />
                  <span className="text-[var(--a-text)]/75">Founder approval</span>
                </span>
                {task.approvedBy ? (
                  <span className="max-w-[55%] truncate font-mono text-[7.5px] text-[var(--a-mint)]/75">
                    {task.approvedBy}
                  </span>
                ) : null}
              </div>

              {isApplied ? (
                <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-[var(--a-mint)]/85">
                  <BadgeCheck className="mt-0.5 size-3 shrink-0" />
                  Applied by {task.approvedBy ?? "founder"} · in-app buffer updated,
                  repository unchanged, audit recorded.
                </p>
              ) : isRejected ? (
                <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-[#ffb3a8]">
                  <X className="mt-0.5 size-3 shrink-0" />
                  Rejected. No change will be executed.
                </p>
              ) : task.status === "approved" ? (
                <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-[#c3e8f2]">
                  <Check className="mt-0.5 size-3 shrink-0" />
                  Approved by {task.approvedBy}. APPLY is now unlocked; execution
                  is a separate server mutation.
                </p>
              ) : (
                <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-[var(--a-muted)]">
                  <LockKeyhole className="mt-0.5 size-3 shrink-0" />
                  Awaiting founder approval. The plan engine cannot approve its own
                  proposal.
                </p>
              )}

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  data-action="approve"
                  onClick={() => void approve()}
                  disabled={!canApprove || controller.pending}
                  className="aurora-outline-btn aurora-focus flex items-center gap-1 rounded-sm px-2 py-1 font-mono text-[8px] tracking-[0.1em] uppercase disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {controller.pending && canApprove ? (
                    <Loader2 className="size-2.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="size-2.5" />
                  )}
                  approve
                </button>
                <button
                  type="button"
                  data-action="apply"
                  onClick={() => void apply()}
                  disabled={!canApply || controller.pending}
                  className="aurora-cta aurora-focus flex items-center gap-1 rounded-sm px-2 py-1 font-mono text-[8px] tracking-[0.12em] uppercase disabled:cursor-not-allowed disabled:opacity-35"
                  title={canApply ? "Apply the approved change" : "Approval required first"}
                >
                  {controller.pending && canApply ? (
                    <Loader2 className="size-2.5 animate-spin" />
                  ) : (
                    <Play className="size-2.5" />
                  )}
                  apply
                </button>
                <button
                  type="button"
                  data-action="reject"
                  onClick={() => void reject()}
                  disabled={!task || isApplied || isRejected || controller.pending}
                  className="aurora-focus ml-auto flex items-center gap-1 rounded-sm px-1.5 py-1 font-mono text-[8px] tracking-[0.08em] text-[var(--a-muted)] uppercase transition-colors hover:bg-[#ff8a7a]/10 hover:text-[#ffb3a8] disabled:opacity-35"
                >
                  <X className="size-2.5" /> reject
                </button>
              </div>

              {controller.mode === "guest" ? (
                <p className="mt-2 border-t border-[var(--a-line)] pt-1.5 text-[9.5px] leading-relaxed text-[var(--a-amber)]/80">
                  Guest preview: these approvals are local only.{" "}
                  <Link
                    to="/auth?returnTo=/dashboard"
                    className="underline underline-offset-2 hover:text-[var(--a-amber)]"
                  >
                    Sign in as founder
                  </Link>{" "}
                  to have Convex enforce authorization and audit every action.
                </p>
              ) : (
                <p className="mt-2 border-t border-[var(--a-line)] pt-1.5 font-mono text-[8px] text-[var(--a-muted)]">
                  server-enforced · owner-scoped · audited
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-sm border border-dashed border-[var(--a-line)] px-3 py-5 text-center">
            <Sparkles className="mx-auto size-4 text-[var(--a-muted)]/60" />
            <p className="mt-2 font-mono text-[9px] text-[var(--a-muted)]">
              No proposal in Engineering yet
            </p>
            <p className="mt-1 text-[10px] text-[var(--a-muted)]">
              Send a task from Learning to review its diff here.
            </p>
          </div>
        )}
      </div>

      {/* prompt box pinned to the bottom of the AI pane */}
      <div className="shrink-0 border-t border-[var(--a-line)] bg-[#061012] p-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
          className="flex items-end gap-1.5 rounded-sm border border-[var(--a-line)] bg-[#081618] px-2 py-1.5 focus-within:border-[var(--a-mint)]/30"
        >
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submit();
              }
            }}
            rows={1}
            placeholder="Instruct the plan engine…"
            aria-label="Engineering prompt"
            className="max-h-20 min-h-[20px] flex-1 resize-none bg-transparent py-0.5 font-sans text-[11px] leading-relaxed text-[var(--a-text)] outline-none placeholder:text-[var(--a-muted)]/70"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            data-action="send-engineering-prompt"
            className="aurora-cta flex size-6 shrink-0 items-center justify-center rounded-sm disabled:opacity-35"
            aria-label="Send engineering prompt"
          >
            {sending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Send className="size-3" />
            )}
          </button>
        </form>
        <div className="mt-1 flex items-center justify-between px-0.5 font-mono text-[7.5px] text-[var(--a-muted)]/65">
          <span>plan engine · deterministic · no external model</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-2.5" /> approval separate
          </span>
        </div>
      </div>
    </div>
  );
}

function PreviewTab({ controller }: { controller: NexoraController }) {
  const applied = controller.activeTask?.status === "applied";
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="aurora-label">Preview buffer</p>
        <span
          className={cn(
            "rounded-sm border px-1.5 py-0.5 font-mono text-[7.5px] tracking-[0.12em] uppercase",
            applied
              ? "border-[var(--a-mint)]/30 bg-[var(--a-mint)]/10 text-[var(--a-mint)]"
              : "border-[var(--a-line)] text-[var(--a-muted)]",
          )}
        >
          {applied ? "patched" : "pre-approval"}
        </span>
      </div>

      <div className="overflow-hidden rounded-sm border border-[var(--a-line)] bg-[#050e10]">
        <div className="flex items-center justify-between border-b border-[var(--a-line)] px-2.5 py-1.5">
          <span className="flex items-center gap-1.5 font-mono text-[8px] tracking-[0.16em] text-[var(--a-text)]/75 uppercase">
            <span className="size-1.5 rounded-full bg-[var(--a-mint)]" />
            Aurora · dock telemetry
          </span>
          <span className="font-mono text-[7px] text-[var(--a-muted)]">1440 × 900</span>
        </div>
        <div className="relative overflow-hidden bg-[radial-gradient(90%_70%_at_50%_100%,rgba(30,100,90,0.3),transparent_65%),#050b0d] p-3">
          <div className="flex items-center justify-between font-mono text-[6.5px] tracking-[0.16em] text-[var(--a-muted)] uppercase">
            <span>Nexora / Aurora</span>
            <span className="flex items-center gap-1">
              <span className="size-1 rounded-full bg-[var(--a-mint)]" /> wm 04
            </span>
          </div>
          <div className="mt-3 flex items-center justify-center gap-1">
            {["AR", "SY", "OR", "SE", "TE", "NX"].map((slot) => (
              <span
                key={slot}
                className={cn(
                  "flex size-5 items-center justify-center rounded-sm border font-mono text-[6px]",
                  slot === "NX"
                    ? "border-[var(--a-mint)]/45 bg-[var(--a-mint)]/10 text-[var(--a-mint)]"
                    : "border-[var(--a-line)] text-[var(--a-muted)]/60",
                )}
              >
                {slot}
              </span>
            ))}
          </div>
          <p className="mt-3 text-center font-mono text-[7px] tracking-[0.14em] text-[var(--a-mint)]/55 uppercase">
            dock telemetry emitted · slot nexora-workspace
          </p>
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between rounded-sm border border-[var(--a-line)] bg-white/[0.015] px-2 py-1.5">
              <span className="font-mono text-[7.5px] text-[var(--a-text)]/75">
                paneMode
              </span>
              <span className="font-mono text-[7.5px] text-[var(--a-mint)]/85">docked</span>
            </div>
            <div className="flex items-center justify-between rounded-sm border border-[var(--a-line)] bg-white/[0.015] px-2 py-1.5">
              <span className="font-mono text-[7.5px] text-[var(--a-text)]/75">
                railItems
              </span>
              <span className="font-mono text-[7.5px] text-[var(--a-mint)]/85">
                learning · engineering
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[10px] leading-relaxed text-[var(--a-muted)]">
        This preview renders the in-app buffer. {applied ? "The approved hunk is shown as added lines." : "Apply the approved change to see the patched buffer."} No repository file has been modified.
      </p>
    </div>
  );
}

function BuildTab() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="aurora-label">Build</p>
        <span className="rounded-sm border border-[var(--a-amber)]/30 bg-[var(--a-amber)]/10 px-1.5 py-0.5 font-mono text-[7.5px] tracking-[0.12em] text-[var(--a-amber)] uppercase">
          not run
        </span>
      </div>
      <div className="rounded-sm border border-dashed border-[var(--a-line)] p-3 text-center">
        <SquareTerminal className="mx-auto size-4 text-[var(--a-muted)]/60" />
        <p className="mt-2 font-mono text-[9px] tracking-[0.1em] text-[var(--a-text)]/75 uppercase">
          no build runner attached
        </p>
        <p className="mt-1.5 text-[10px] leading-relaxed text-[var(--a-muted)]">
          Nothing has been compiled in this workspace, so there is no exit code or
          output to report. This panel will never display a result it did not receive.
        </p>
      </div>
      <div className="rounded-sm border border-[var(--a-line)] bg-white/[0.015] px-2.5 py-1">
        <KeyValue k="Status" v="NOT IMPLEMENTED" />
        <KeyValue k="Command" v="—" />
        <KeyValue k="Exit code" v="—" />
        <KeyValue k="Artifacts" v="none" />
      </div>
      <button
        type="button"
        disabled
        className="aurora-outline-btn flex w-full items-center justify-center gap-1.5 rounded-sm px-2 py-1.5 font-mono text-[8px] tracking-[0.12em] uppercase opacity-40"
      >
        <Play className="size-2.5" /> request build (unavailable)
      </button>
    </div>
  );
}

function TestsTab() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="aurora-label">Tests</p>
        <span className="rounded-sm border border-[var(--a-amber)]/30 bg-[var(--a-amber)]/10 px-1.5 py-0.5 font-mono text-[7.5px] tracking-[0.12em] text-[var(--a-amber)] uppercase">
          not run
        </span>
      </div>
      <div className="rounded-sm border border-dashed border-[var(--a-line)] p-3 text-center">
        <FlaskConical className="mx-auto size-4 text-[var(--a-muted)]/60" />
        <p className="mt-2 font-mono text-[9px] tracking-[0.1em] text-[var(--a-text)]/75 uppercase">
          no test suite detected
        </p>
        <p className="mt-1.5 text-[10px] leading-relaxed text-[var(--a-muted)]">
          The workspace snapshot contains no test files, and no test command has
          been executed. Zero tests passed, zero failed, zero executed.
        </p>
      </div>
      <div className="rounded-sm border border-[var(--a-line)] bg-white/[0.015] px-2.5 py-1">
        <KeyValue k="Executed" v="0" />
        <KeyValue k="Passed" v="0" />
        <KeyValue k="Failed" v="0" />
        <KeyValue k="Coverage" v="not measured" />
      </div>
    </div>
  );
}

function EngineeringReportTab({ controller }: { controller: NexoraController }) {
  const task = controller.activeTask;
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="aurora-label">Engineering report</p>
          <h3 className="mt-1 text-[12px] leading-snug font-medium text-[var(--a-text)]/90">
            {task?.code} · {task?.title ?? "no task"}
          </h3>
        </div>
        {task ? <StatusChip value={task.status} /> : null}
      </div>

      <div className="rounded-sm border border-[var(--a-line)] bg-white/[0.015] px-2.5 py-1">
        <KeyValue k="Workspace" v={controller.data.workspacePath} />
        <KeyValue k="Mode" v={controller.mode === "founder" ? "founder / live" : "guest / local"} />
        <KeyValue k="Patch target" v={task?.filePath ?? "—"} />
        <KeyValue k="Returned" v={task?.status === "applied" ? "buffer updated" : "not applied"} />
        <KeyValue k="Repository write" v="none" />
      </div>

      <div>
        <p className="aurora-label mb-1.5">Audit trail</p>
        <div className="space-y-1.5">
          {controller.data.audit.slice(0, 8).map((entry) => (
            <div
              key={entry.id}
              className="rounded-sm border border-[var(--a-line)] bg-white/[0.012] px-2 py-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-mono text-[8px] tracking-[0.1em] text-[var(--a-mint)]/75 uppercase">
                  {entry.action}
                </span>
                <span className="shrink-0 font-mono text-[7.5px] text-[var(--a-muted)]/70">
                  {formatWhen(entry.at)}
                </span>
              </div>
              <p className="mt-0.5 text-[9.5px] leading-relaxed text-[var(--a-muted)]">
                {entry.detail}
              </p>
              <p className="mt-0.5 font-mono text-[7.5px] text-[var(--a-muted)]/60">
                actor · {entry.actor}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-sm border border-[var(--a-line)] bg-white/[0.015] p-2.5">
        <p className="flex items-center gap-1.5 font-mono text-[8px] tracking-[0.14em] text-[var(--a-muted)] uppercase">
          <Database className="size-2.5" /> limitations
        </p>
        <ul className="mt-1.5 space-y-1 text-[9.5px] leading-relaxed text-[var(--a-muted)]">
          <li>· Build and test runners are not connected; no run is reported.</li>
          <li>· Applying updates the in-app file buffer, not the repository on disk.</li>
          <li>· External sources are unverified because no network fetch was performed.</li>
          <li>· The plan engine is deterministic; no external model is attached.</li>
        </ul>
      </div>
    </div>
  );
}

function EngineeringOutputPane({ controller }: { controller: NexoraController }) {
  const [tab, setTab] = useState<EngTab>("preview");
  return (
    <div
      data-pane="engineering-output"
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[#061113]"
    >
      <PaneHeader
        icon={PanelRight}
        label="Output"
        hint={controller.data.taskCode}
        right={
          <span className="flex items-center gap-1 font-mono text-[8px] tracking-[0.12em] text-[var(--a-muted)] uppercase">
            <ScanLine className="size-2.5" /> engineering
          </span>
        }
      />
      <TabBar
        ariaLabel="Engineering output"
        tabs={OUTPUT_TABS}
        value={tab}
        onChange={setTab}
      />
      <div className="aurora-scroll flex-1 p-3">
        {tab === "preview" ? <PreviewTab controller={controller} /> : null}
        {tab === "build" ? <BuildTab /> : null}
        {tab === "tests" ? <TestsTab /> : null}
        {tab === "report" ? <EngineeringReportTab controller={controller} /> : null}
      </div>
    </div>
  );
}

export function EngineeringLayout({
  controller,
  compact,
  activePane,
  selectedFile,
  onSelectFile,
}: {
  controller: NexoraController;
  compact: boolean;
  activePane: string;
  selectedFile: string;
  onSelectFile: (path: string) => void;
}) {
  const [files, setFiles] = useState<number>(DEFAULT_SPLITS.files);
  const [output, setOutput] = useState<number>(DEFAULT_SPLITS.output);
  const [code, setCode] = useState<number>(DEFAULT_SPLITS.code);
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);

  const dragFiles = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    event.preventDefault();
    const start = files;
    const startX = event.clientX;
    const min = PANE_LIMITS.engineeringFiles / rect.width;
    const max = 1 - output - PANE_LIMITS.engineeringCenter / rect.width;
    const move = (moveEvent: PointerEvent) => {
      const delta = (moveEvent.clientX - startX) / rect.width;
      setFiles(Math.min(Math.max(start + delta, min), Math.max(min, max)));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const dragOutput = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    event.preventDefault();
    const start = output;
    const startX = event.clientX;
    const min = PANE_LIMITS.engineeringOutput / rect.width;
    const max = 1 - files - PANE_LIMITS.engineeringCenter / rect.width;
    const move = (moveEvent: PointerEvent) => {
      const delta = (moveEvent.clientX - startX) / rect.width;
      setOutput(Math.min(Math.max(start - delta, min), Math.max(min, max)));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const dragCode = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = centerRef.current?.getBoundingClientRect();
    if (!rect) return;
    event.preventDefault();
    const start = code;
    const startY = event.clientY;
    const min = PANE_LIMITS.code / rect.height;
    const max = 1 - PANE_LIMITS.ai / rect.height;
    const move = (moveEvent: PointerEvent) => {
      const delta = (moveEvent.clientY - startY) / rect.height;
      setCode(Math.min(Math.max(start + delta, min), Math.max(min, max)));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  if (compact) {
    if (activePane === "files") {
      return (
        <FilesPane
          controller={controller}
          selectedFile={selectedFile}
          onSelectFile={onSelectFile}
        />
      );
    }
    if (activePane === "output") {
      return <EngineeringOutputPane controller={controller} />;
    }
    if (activePane === "ai") {
      return <EngineeringAiPane controller={controller} />;
    }
    return <CodePane controller={controller} selectedFile={selectedFile} />;
  }

  return (
    <div
      ref={containerRef}
      data-layout="engineering"
      className="grid h-full min-h-0 w-full"
      style={{
        gridTemplateColumns: `${files * 100}% 6px minmax(0, 1fr) 6px ${output * 100}%`,
      }}
    >
      <FilesPane
        controller={controller}
        selectedFile={selectedFile}
        onSelectFile={onSelectFile}
      />
      <Divider axis="x" onPointerDown={dragFiles} label="Resize Files pane" />
      <div
        ref={centerRef}
        className="grid min-h-0 min-w-0"
        style={{ gridTemplateRows: `${code * 100}% 6px minmax(0, 1fr)` }}
      >
        <CodePane controller={controller} selectedFile={selectedFile} />
        <Divider axis="y" onPointerDown={dragCode} label="Resize Code and AI panes" />
        <EngineeringAiPane controller={controller} />
      </div>
      <Divider axis="x" onPointerDown={dragOutput} label="Resize Output pane" />
      <EngineeringOutputPane controller={controller} />
    </div>
  );
}
