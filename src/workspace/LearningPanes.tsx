import { Link } from "react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DEFAULT_SPLITS, PANE_LIMITS } from "@/nexora/layout";
import type { NexoraController } from "@/nexora/useNexora";
import type { Attachment, ChatMessage } from "@/nexora/types";
import {
  Divider,
  KeyValue,
  PaneHeader,
  StatusChip,
  TabBar,
  formatTime,
  formatWhen,
} from "@/nexora/ui";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Database,
  ExternalLink,
  FileCode2,
  FileText,
  GraduationCap,
  Link2,
  ListChecks,
  Loader2,
  LockKeyhole,
  MessagesSquare,
  Paperclip,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

export const LEARNING_TABS = [
  { id: "conversation", label: "Conversation" },
  { id: "output", label: "Output" },
] as const;

type OutputTab = "report" | "sources" | "knowledge" | "tasks";

const OUTPUT_TABS: { id: OutputTab; label: string }[] = [
  { id: "report", label: "Report" },
  { id: "sources", label: "Sources" },
  { id: "knowledge", label: "Knowledge" },
  { id: "tasks", label: "Proposed Tasks" },
];

function AttachmentRow({ item }: { item: Attachment }) {
  const Icon = item.kind === "link" ? Link2 : FileText;
  const content = (
    <>
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-[var(--a-line)] bg-white/[0.035]">
        <Icon className="size-3 text-[var(--a-muted)]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-mono text-[10.5px] text-[var(--a-text)]/85">
          {item.name}
        </span>
        <span className="mt-0.5 block truncate text-[10px] text-[var(--a-muted)]">
          {item.detail}
        </span>
      </span>
      <StatusChip value={item.status} />
    </>
  );

  if (item.href) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer noopener"
        className="aurora-focus flex items-start gap-2 rounded-lg border border-[var(--a-line)] bg-white/[0.02] px-2.5 py-2 transition-colors hover:border-[var(--a-line-strong)] hover:bg-white/[0.04]"
      >
        {content}
        <ExternalLink className="mt-1 size-2.5 shrink-0 text-[var(--a-muted)]" />
      </a>
    );
  }
  return (
    <div className="flex items-start gap-2 rounded-lg border border-[var(--a-line)] bg-white/[0.02] px-2.5 py-2">
      {content}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const assistant = message.role === "assistant";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-[11px]">
        {assistant ? (
          <>
            <span className="flex size-4 shrink-0 items-center justify-center rounded bg-white/[0.06]">
              <Sparkles className="size-2.5 text-[var(--a-ice)]" />
            </span>
            <span className="font-medium text-[var(--a-text)]/90">Nexora</span>
            <span className="text-[var(--a-muted)]/70">plan engine</span>
          </>
        ) : (
          <>
            <span className="flex size-4 shrink-0 items-center justify-center rounded bg-[var(--a-ice)]/15 text-[8px] font-semibold text-[var(--a-ice)]">
              Y
            </span>
            <span className="font-medium text-[var(--a-text)]/90">You</span>
          </>
        )}
        <span className="ml-auto shrink-0 font-mono text-[9px] text-[var(--a-muted)]/60">
          {formatTime(message.at)}
        </span>
      </div>
      <div
        className={cn(
          "w-full",
          assistant
            ? "text-[12.5px] leading-[1.7] text-[var(--a-text)]/85"
            : "rounded-lg border border-[var(--a-line)] bg-white/[0.025] px-3 py-2.5 text-[12.5px] leading-[1.7] text-[var(--a-text)]/90",
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.attachments && message.attachments.length > 0 ? (
          <div className="mt-2.5 flex flex-col gap-1.5">
            {message.attachments.map((item) => (
              <AttachmentRow key={`${message.id}-${item.name}`} item={item} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ConversationPane({ controller }: { controller: NexoraController }) {
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const linkedContext = Array.from(
    new Map(
      controller.data.messages
        .flatMap((message) => message.attachments ?? [])
        .map((item) => [item.name, item]),
    ).values(),
  );

  const submit = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      await controller.sendMessage(draft, attachments);
      setDraft("");
      setAttachments([]);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "The prompt could not be sent.",
      );
    } finally {
      setSending(false);
    }
  };

  const onFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const added: Attachment[] = Array.from(files).map((file) => ({
      name: file.name,
      kind: "file",
      status: "attached",
      detail: `${(file.size / 1024).toFixed(1)} KB · metadata only · not uploaded`,
    }));
    setAttachments((current) => [...current, ...added].slice(0, 5));
    toast(`${added.length} attachment${added.length === 1 ? "" : "s"} staged`, {
      description: "Metadata is attached; file contents are not uploaded.",
    });
  };

  return (
    <div
      data-pane="conversation"
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[#090d16]"
    >
      <PaneHeader
        icon={MessagesSquare}
        label="Conversation"
        hint="learning · read + propose"
        right={
          <span className="flex items-center gap-1.5 font-mono text-[8px] tracking-[0.12em] text-[var(--a-muted)] uppercase">
            <span
              className={cn(
                "size-1 rounded-full",
                controller.mode === "founder" ? "bg-[var(--a-mint)]" : "bg-[var(--a-muted)]",
              )}
            />
            {controller.mode === "founder" ? "live" : "guest"}
          </span>
        }
      />

      <div ref={scrollRef} className="aurora-scroll flex-1 space-y-5 px-3 py-3">
        {controller.syncing ? (
          <div className="flex items-center gap-2 rounded-sm border border-[var(--a-line)] px-3 py-2 font-mono text-[9px] text-[var(--a-muted)]">
            <Loader2 className="size-3 animate-spin" /> syncing founder workspace…
          </div>
        ) : null}

        {controller.data.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {linkedContext.length > 0 ? (
          <div className="pt-1">
            <div className="mb-2 flex items-center justify-between">
              <span className="aurora-label">Attachments + links</span>
              <span className="font-mono text-[8px] text-[var(--a-muted)]">
                {linkedContext.length} items
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {linkedContext.map((item) => (
                <AttachmentRow key={`ctx-${item.name}`} item={item} />
              ))}
            </div>
          </div>
        ) : null}

        <div className="h-1" />
      </div>

      <div className="shrink-0 border-t border-[var(--a-line)] bg-[#090d16] p-2">
        {attachments.length > 0 ? (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {attachments.map((item) => (
              <span
                key={item.name}
                className="flex items-center gap-1 rounded-md border border-[var(--a-ice)]/25 bg-[var(--a-ice)]/[0.08] px-1.5 py-1 font-mono text-[9px] text-[var(--a-text)]/80"
              >
                <Paperclip className="size-2.5 text-[var(--a-ice)]" />
                {item.name}
                <button
                  type="button"
                  aria-label={`Remove ${item.name}`}
                  onClick={() =>
                    setAttachments((current) =>
                      current.filter((entry) => entry.name !== item.name),
                    )
                  }
                  className="ml-0.5 text-[var(--a-muted)] hover:text-[var(--a-text)]"
                >
                  <X className="size-2.5" />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
          className="rounded-xl border border-[var(--a-line-strong)] bg-[#111827] px-2.5 pt-2 pb-1.5 focus-within:border-white/25"
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
            rows={2}
            placeholder="Message…"
            aria-label="Prompt"
            className="block w-full resize-none bg-transparent py-0.5 text-[12.5px] leading-relaxed text-[var(--a-text)] outline-none placeholder:text-[var(--a-muted)]/80"
          />
          <div className="mt-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <input
                ref={fileInput}
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                  onFiles(event.target.files);
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="aurora-focus flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[10px] text-[var(--a-muted)] transition-colors hover:bg-white/[0.05] hover:text-[var(--a-text)]"
                aria-label="Attach files"
              >
                <Paperclip className="size-3.5" />
                <span className="hidden sm:inline">Attach</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden max-w-[140px] truncate text-[10px] text-[var(--a-muted)]/70 sm:inline">
                {controller.data.sources.length} files indexed
              </span>
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                data-action="send-prompt"
                className="aurora-cta aurora-focus flex size-7 items-center justify-center rounded-lg disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send prompt"
              >
                {sending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
              </button>
            </div>
          </div>
        </form>

        <div className="mt-1 flex items-center justify-between gap-2 px-1 text-[9.5px] text-[var(--a-muted)]/60">
          <span className="truncate">
            {controller.mode === "founder"
              ? "founder session · prompts audited"
              : "guest preview · messages stay on this device"}
          </span>
          {controller.mode === "guest" ? (
            <Link
              to="/auth?returnTo=/dashboard"
              className="flex shrink-0 items-center gap-1 text-[var(--a-mint)]/80 hover:text-[var(--a-mint)]"
            >
              sign in <ArrowUpRight className="size-2.5" />
            </Link>
          ) : (
            <span className="flex shrink-0 items-center gap-1 text-[var(--a-mint)]/70">
              <ShieldCheck className="size-2.5" /> server
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportTab({ controller }: { controller: NexoraController }) {
  const task = controller.activeTask;
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="aurora-label">Learning report</p>
          <h3 className="mt-1 text-[13px] leading-snug font-medium text-[var(--a-text)]">
            {task?.title ?? "No active proposal"}
          </h3>
        </div>
        {task ? <StatusChip value={task.status} /> : null}
      </div>

      <p className="text-[11px] leading-relaxed text-[var(--a-muted)]">
        {task?.summary ??
          "Aurora shell indexed. No proposal is open in this workspace yet."}
      </p>

      <div className="rounded-sm border border-[var(--a-line)] bg-white/[0.015] px-3 py-1.5">
        <KeyValue k="Workspace" v={controller.data.workspacePath} />
        <KeyValue k="Task" v={controller.data.taskCode} />
        <KeyValue k="Session" v={controller.mode === "founder" ? "Founder / server" : "Guest / local"} />
        <KeyValue k="Plan engine" v="deterministic, no external model" />
        <KeyValue k="Source writes" v="blocked for Learning" />
        <KeyValue k="Build runner" v="not connected" />
        <KeyValue k="Test runner" v="not connected" />
      </div>

      <div>
        <p className="aurora-label mb-1.5">Inspected this session</p>
        <ul className="space-y-1">
          {[
            "src/nexora/layout.ts — split limits and breakpoint",
            "src/nexora/types.ts — workspace + task model",
            "src/nexora/data.ts — seeded proposal and statuses",
            "src/convex/nexora.ts — approval and audit mutations",
          ].map((line) => (
            <li
              key={line}
              className="flex items-start gap-1.5 font-mono text-[10px] leading-relaxed text-[var(--a-muted)]"
            >
              <Check className="mt-0.5 size-2.5 shrink-0 text-[var(--a-mint)]/70" />
              {line}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-[var(--a-ice)]/25 bg-[var(--a-ice)]/[0.06] p-2.5">
        <p className="flex items-center gap-1.5 font-mono text-[8px] tracking-[0.14em] text-[var(--a-ice)]/90 uppercase">
          <LockKeyhole className="size-2.5" /> boundary
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--a-text)]/70">
          Learning may propose tasks. It never executes source changes. Approval
          and execution are separate founder actions inside Engineering.
        </p>
      </div>

      <div>
        <p className="aurora-label mb-1.5">Not verified here</p>
        <p className="text-[11px] leading-relaxed text-[var(--a-muted)]">
          No build or test command has run in this environment. External links are
          marked unverified because nothing was fetched. The Report never claims a
          pass it did not observe.
        </p>
      </div>
    </div>
  );
}

function SourcesTab({ controller }: { controller: NexoraController }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="aurora-label">Source ledger</p>
        <span className="font-mono text-[8px] text-[var(--a-muted)]">
          {controller.data.sources.length} entries
        </span>
      </div>
      <p className="pb-1 text-[10px] leading-relaxed text-[var(--a-muted)]">
        Statuses describe what happened in this session. “Unverified” means the
        link was supplied but not fetched; “unavailable” means nothing was read.
      </p>
      {controller.data.sources.map((source) => {
        const external = source.url.startsWith("http");
        return (
          <div
            key={source.id}
            className="rounded-sm border border-[var(--a-line)] bg-white/[0.015] px-2.5 py-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                {external ? (
                  <Link2 className="size-3 shrink-0 text-[var(--a-sky,var(--a-ice))]/70" />
                ) : (
                  <FileCode2 className="size-3 shrink-0 text-[var(--a-mint)]/70" />
                )}
                <span className="truncate font-mono text-[10px] text-[var(--a-text)]/85">
                  {source.title}
                </span>
              </div>
              <StatusChip value={source.status} />
            </div>
            <p className="mt-1 font-mono text-[8.5px] break-all text-[var(--a-muted)]/75">
              {source.url}
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-[var(--a-muted)]">
              {source.detail}
            </p>
            {external ? (
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-1.5 inline-flex items-center gap-1 font-mono text-[8px] tracking-[0.1em] text-[var(--a-mint)]/70 uppercase hover:text-[var(--a-mint)]"
              >
                open external <ExternalLink className="size-2.5" />
              </a>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function KnowledgeTab({ controller }: { controller: NexoraController }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || !body.trim() || saving) return;
    setSaving(true);
    try {
      await controller.saveKnowledge(title, body, "NOTE");
      setTitle("");
      setBody("");
      setAdding(false);
      toast.success("Knowledge note saved", {
        description:
          controller.mode === "founder"
            ? "Persisted in Convex and audit-logged."
            : "Saved to this device's local preview.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save note.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="aurora-label">Knowledge base</p>
        <button
          type="button"
          onClick={() => setAdding((value) => !value)}
          className="aurora-focus flex items-center gap-1 rounded-sm border border-[var(--a-line)] px-1.5 py-1 font-mono text-[8px] tracking-[0.1em] text-[var(--a-text)]/75 uppercase hover:border-[var(--a-mint)]/30"
        >
          {adding ? <X className="size-2.5" /> : <Plus className="size-2.5" />}
          {adding ? "cancel" : "new note"}
        </button>
      </div>

      {adding ? (
        <div className="space-y-1.5 rounded-sm border border-[var(--a-line)] bg-white/[0.02] p-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Note title"
            aria-label="Knowledge note title"
            className="w-full rounded-md border border-[var(--a-line)] bg-[#0b1120] px-2 py-1.5 text-[11.5px] text-[var(--a-text)] outline-none placeholder:text-[var(--a-muted)]/60 focus:border-white/25"
          />
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={3}
            placeholder="What should persist for the next session?"
            aria-label="Knowledge note body"
            className="w-full resize-none rounded-md border border-[var(--a-line)] bg-[#0b1120] px-2 py-1.5 text-[11.5px] leading-relaxed text-[var(--a-text)] outline-none placeholder:text-[var(--a-muted)]/60 focus:border-white/25"
          />
          <button
            type="button"
            onClick={() => void save()}
            disabled={!title.trim() || !body.trim() || saving}
            className="aurora-cta flex items-center gap-1.5 rounded-sm px-2 py-1 font-mono text-[8px] tracking-[0.12em] uppercase disabled:opacity-40"
          >
            {saving ? <Loader2 className="size-2.5 animate-spin" /> : <Database className="size-2.5" />}
            save note
          </button>
        </div>
      ) : null}

      {controller.data.knowledge.map((note) => (
        <article
          key={note.id}
          className="rounded-sm border border-[var(--a-line)] bg-white/[0.015] px-2.5 py-2"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5">
              <BookOpen className="size-3 shrink-0 text-[var(--a-mint)]/70" />
              <span className="truncate text-[11px] font-medium text-[var(--a-text)]/90">
                {note.title}
              </span>
            </span>
            <span className="shrink-0 rounded-sm bg-white/[0.05] px-1 py-0.5 font-mono text-[7.5px] tracking-[0.1em] text-[var(--a-muted)]">
              {note.tag}
            </span>
          </div>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-[var(--a-muted)]">
            {note.body}
          </p>
          <p className="mt-1.5 font-mono text-[8px] text-[var(--a-muted)]/60">
            {formatWhen(note.at)} · persists across reloads
          </p>
        </article>
      ))}
    </div>
  );
}

function TasksTab({
  controller,
  onOpenEngineering,
}: {
  controller: NexoraController;
  onOpenEngineering: () => void;
}) {
  const tasks = controller.data.tasks;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="aurora-label">Proposed tasks</p>
        <span className="font-mono text-[8px] text-[var(--a-muted)]">
          {tasks.length} proposal{tasks.length === 1 ? "" : "s"}
        </span>
      </div>
      <p className="text-[10px] leading-relaxed text-[var(--a-muted)]">
        Learning can propose. Engineering shows the diff; only a founder approves
        and applies it.
      </p>

      {tasks.length === 0 ? (
        <div className="rounded-sm border border-dashed border-[var(--a-line)] px-3 py-6 text-center">
          <ListChecks className="mx-auto size-4 text-[var(--a-muted)]/60" />
          <p className="mt-2 font-mono text-[9px] text-[var(--a-muted)]">
            No proposals yet
          </p>
        </div>
      ) : null}

      {tasks.map((task) => (
        <article
          key={task.id}
          data-task-card={task.code}
          className="rounded-sm border border-[var(--a-line)] bg-white/[0.015] p-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-mono text-[8px] tracking-[0.14em] text-[var(--a-mint)]/70 uppercase">
                {task.code}
              </p>
              <h4 className="mt-0.5 text-[11.5px] leading-snug font-medium text-[var(--a-text)]/90">
                {task.title}
              </h4>
            </div>
            <StatusChip value={task.status} />
          </div>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-[var(--a-muted)]">
            {task.summary}
          </p>
          <div className="mt-2 flex items-center gap-1.5 font-mono text-[8.5px] text-[var(--a-muted)]">
            <FileCode2 className="size-2.5 text-[var(--a-mint)]/60" />
            {task.filePath}
            <span className="text-[var(--a-muted)]/50">·</span>
            {task.plan.length} steps
          </div>

          <div className="mt-2.5 flex items-center gap-1.5">
            {task.sentToEngineering ? (
              <button
                type="button"
                onClick={onOpenEngineering}
                className="aurora-outline-btn aurora-focus flex items-center gap-1 rounded-sm px-2 py-1 font-mono text-[8px] tracking-[0.1em] uppercase"
              >
                Open in Engineering <ArrowUpRight className="size-2.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await controller.sendToEngineering(task.code);
                    toast.success(`${task.code} sent to Engineering`, {
                      description: "Approval is still required before any change.",
                    });
                  } catch (error) {
                    toast.error(
                      error instanceof Error ? error.message : "Could not send task.",
                    );
                  }
                }}
                className="aurora-cta aurora-focus flex items-center gap-1 rounded-sm px-2 py-1 font-mono text-[8px] tracking-[0.12em] uppercase"
              >
                Send to Engineering <ArrowUpRight className="size-2.5" />
              </button>
            )}
            <span className="font-mono text-[7.5px] tracking-[0.08em] text-[var(--a-muted)]/60 uppercase">
              {task.sentToEngineering ? "in engineering" : "learning only"}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

function LearningOutputPane({
  controller,
  onOpenEngineering,
}: {
  controller: NexoraController;
  onOpenEngineering: () => void;
}) {
  const [tab, setTab] = useState<OutputTab>("report");
  const counts: Record<OutputTab, number | undefined> = {
    report: undefined,
    sources: controller.data.sources.length,
    knowledge: controller.data.knowledge.length,
    tasks: controller.data.tasks.length,
  };

  return (
    <div
      data-pane="learning-output"
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[#090d16]"
    >
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-[var(--a-line)] bg-[#0b1120] pr-3">
        <TabBar
          ariaLabel="Learning output"
          tabs={OUTPUT_TABS.map((item) => ({
            ...item,
            count: counts[item.id],
          }))}
          value={tab}
          onChange={setTab}
          className="border-b-0"
        />
        <span className="flex shrink-0 items-center gap-1 font-mono text-[8.5px] tracking-[0.08em] text-[var(--a-muted)]/70 uppercase">
          <GraduationCap className="size-2.5" /> learning
        </span>
      </div>
      <div className="aurora-scroll flex-1 p-3">
        {tab === "report" ? <ReportTab controller={controller} /> : null}
        {tab === "sources" ? <SourcesTab controller={controller} /> : null}
        {tab === "knowledge" ? <KnowledgeTab controller={controller} /> : null}
        {tab === "tasks" ? (
          <TasksTab controller={controller} onOpenEngineering={onOpenEngineering} />
        ) : null}
      </div>
    </div>
  );
}

export function LearningLayout({
  controller,
  compact,
  activePane,
  onOpenEngineering,
}: {
  controller: NexoraController;
  compact: boolean;
  activePane: string;
  onOpenEngineering: () => void;
}) {
  const [split, setSplit] = useState<number>(DEFAULT_SPLITS.learning);
  const containerRef = useRef<HTMLDivElement>(null);

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    event.preventDefault();
    const startX = event.clientX;
    const startSplit = split;
    const min = (PANE_LIMITS.learningConversation + 6) / rect.width;
    const max = 1 - (PANE_LIMITS.learningOutput + 6) / rect.width;

    const move = (moveEvent: PointerEvent) => {
      const delta = (moveEvent.clientX - startX) / rect.width;
      setSplit(Math.min(Math.max(startSplit + delta, min), Math.max(min, max)));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  if (compact) {
    return activePane === "conversation" ? (
      <ConversationPane controller={controller} />
    ) : (
      <LearningOutputPane
        controller={controller}
        onOpenEngineering={onOpenEngineering}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      data-layout="learning"
      className="grid h-full min-h-0 w-full"
      style={{
        gridTemplateColumns: `${split * 100}% 6px minmax(0, 1fr)`,
      }}
    >
      <ConversationPane controller={controller} />
      <Divider axis="x" onPointerDown={startDrag} label="Resize conversation and output panes" />
      <LearningOutputPane
        controller={controller}
        onOpenEngineering={onOpenEngineering}
      />
    </div>
  );
}
