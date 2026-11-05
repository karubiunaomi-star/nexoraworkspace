import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ACTIVE_TASK_CODE,
  WORKSPACE_PATH,
  composeReply,
  createSeedWorkspace,
} from "./data";
import type {
  Attachment,
  AuditAction,
  AuditEntry,
  ChatMessage,
  KnowledgeNote,
  NexoraTask,
  WorkspaceData,
  WorkspacePiece,
} from "./types";

const GUEST_STORAGE_KEY = "nexora.guest.workspace.v1";

function readGuestWorkspace(): WorkspacePiece {
  try {
    const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WorkspacePiece;
      if (Array.isArray(parsed.messages) && Array.isArray(parsed.tasks)) {
        return parsed;
      }
    }
  } catch {
    // Corrupt local preview state is replaced with the seed.
  }
  return createSeedWorkspace();
}

function localId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * One data surface for both modes.
 *
 * Founder mode reads and writes Convex; approval/execution are checked on the
 * server. Guest mode is explicitly local (and labelled in the UI) so a visitor
 * can inspect the workspace without creating an account. Both modes share the
 * same UI state machine.
 */
export function useNexora() {
  const { isAuthenticated, user } = useAuth();
  const live = useQuery(api.nexora.workspace, isAuthenticated ? {} : "skip");
  const ensureWorkspace = useMutation(api.nexora.ensureWorkspace);
  const sendMessageMutation = useMutation(api.nexora.sendMessage);
  const saveKnowledgeMutation = useMutation(api.nexora.saveKnowledge);
  const sendToEngineeringMutation = useMutation(api.nexora.sendToEngineering);
  const approveTaskMutation = useMutation(api.nexora.approveTask);
  const rejectTaskMutation = useMutation(api.nexora.rejectTask);
  const applyTaskMutation = useMutation(api.nexora.applyTask);

  const [guest, setGuest] = useState<WorkspacePiece>(readGuestWorkspace);
  const [pending, setPending] = useState(false);
  const ensuredFor = useRef<string | null>(null);

  const userId = user?._id ? String(user._id) : null;

  useEffect(() => {
    if (!isAuthenticated || !live?.authenticated) return;
    if (live.seeded) return;
    if (!userId || ensuredFor.current === userId) return;
    ensuredFor.current = userId;
    void ensureWorkspace({}).catch(() => {
      ensuredFor.current = null;
    });
  }, [ensureWorkspace, isAuthenticated, live?.authenticated, live?.seeded, userId]);

  useEffect(() => {
    if (isAuthenticated) return;
    try {
      window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guest));
    } catch {
      // Persistence is best effort; the UI still works in memory.
    }
  }, [guest, isAuthenticated]);

  const appendGuestAudit = useCallback(
    (action: AuditAction, detail: string, actor = "Guest founder") => {
      setGuest((current) => ({
        ...current,
        audit: [
          {
            id: localId("a"),
            actor,
            action,
            detail,
            at: Date.now(),
          },
          ...current.audit,
        ],
      }));
    },
    [],
  );

  const run = useCallback(async (operation: () => Promise<unknown>) => {
    setPending(true);
    try {
      return await operation();
    } finally {
      setPending(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string, attachments: Attachment[] = []) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      if (isAuthenticated) {
        await run(() => sendMessageMutation({ content: trimmed, attachments }));
        return;
      }
      const at = Date.now();
      setGuest((current) => ({
        ...current,
        messages: [
          ...current.messages,
          {
            id: localId("m"),
            role: "user",
            content: trimmed,
            at,
            attachments,
          },
          {
            id: localId("m"),
            role: "assistant",
            content: composeReply(trimmed, current.tasks),
            at: at + 1,
          },
        ],
        audit: [
          {
            id: localId("a"),
            actor: "Guest founder",
            action: "message.sent",
            detail: `Prompt sent to the plan engine · ${trimmed.length} chars`,
            at,
          },
          ...current.audit,
        ],
      }));
    },
    [isAuthenticated, run, sendMessageMutation],
  );

  const saveKnowledge = useCallback(
    async (title: string, body: string, tag = "NOTE") => {
      if (isAuthenticated) {
        await run(() => saveKnowledgeMutation({ title, body, tag }));
        return;
      }
      const note: KnowledgeNote = {
        id: localId("k"),
        title,
        body,
        tag: tag.toUpperCase(),
        at: Date.now(),
      };
      setGuest((current) => ({
        ...current,
        knowledge: [note, ...current.knowledge],
        audit: [
          {
            id: localId("a"),
            actor: "Guest founder",
            action: "knowledge.saved",
            detail: `Knowledge note saved · ${title}`,
            at: note.at,
          },
          ...current.audit,
        ],
      }));
    },
    [isAuthenticated, run, saveKnowledgeMutation],
  );

  const sendToEngineering = useCallback(
    async (code: string) => {
      if (isAuthenticated) {
        await run(() => sendToEngineeringMutation({ code }));
        return;
      }
      setGuest((current) => ({
        ...current,
        tasks: current.tasks.map((task) =>
          task.code === code ? { ...task, sentToEngineering: true } : task,
        ),
        audit: [
          {
            id: localId("a"),
            actor: "Guest founder",
            action: "task.sent_to_engineering",
            detail: `${code} routed to Engineering for review (local preview)`,
            at: Date.now(),
          },
          ...current.audit,
        ],
      }));
    },
    [isAuthenticated, run, sendToEngineeringMutation],
  );

  const approveTask = useCallback(
    async (code: string) => {
      if (isAuthenticated) {
        await run(() => approveTaskMutation({ code }));
        return;
      }
      const at = Date.now();
      setGuest((current) => ({
        ...current,
        tasks: current.tasks.map((task) =>
          task.code === code && task.status === "proposed"
            ? {
                ...task,
                status: "approved",
                approvedBy: "Guest founder (local only)",
                approvedAt: at,
              }
            : task,
        ),
        audit: [
          {
            id: localId("a"),
            actor: "Guest founder",
            action: "task.approved",
            detail: `${code} approved in the local preview · not server-authorized`,
            at,
          },
          ...current.audit,
        ],
      }));
    },
    [isAuthenticated, run, approveTaskMutation],
  );

  const rejectTask = useCallback(
    async (code: string) => {
      if (isAuthenticated) {
        await run(() => rejectTaskMutation({ code }));
        return;
      }
      setGuest((current) => ({
        ...current,
        tasks: current.tasks.map((task) =>
          task.code === code ? { ...task, status: "rejected" } : task,
        ),
        audit: [
          {
            id: localId("a"),
            actor: "Guest founder",
            action: "task.rejected",
            detail: `${code} rejected in the local preview`,
            at: Date.now(),
          },
          ...current.audit,
        ],
      }));
    },
    [isAuthenticated, run, rejectTaskMutation],
  );

  const applyTask = useCallback(
    async (code: string) => {
      if (isAuthenticated) {
        await run(() => applyTaskMutation({ code }));
        return;
      }
      setGuest((current) => {
        const target = current.tasks.find((task) => task.code === code);
        if (!target) return current;
        if (target.status !== "approved") return current;
        const at = Date.now();
        return {
          ...current,
          tasks: current.tasks.map((task) =>
            task.code === code ? { ...task, status: "applied", appliedAt: at } : task,
          ),
          audit: [
            {
              id: localId("a"),
              actor: "Guest founder",
              action: "task.applied",
              detail: `${code} applied to the local buffer · repository unchanged`,
              at,
            },
            ...current.audit,
          ],
        };
      });
    },
    [isAuthenticated, run, applyTaskMutation],
  );

  const data: WorkspaceData = useMemo(() => {
    if (isAuthenticated && live?.authenticated) {
      return {
        mode: "founder",
        taskCode: live.taskCode,
        workspacePath: live.workspacePath,
        messages: (live.messages ?? []) as ChatMessage[],
        sources: (live.sources ?? []) as WorkspaceData["sources"],
        knowledge: (live.knowledge ?? []) as KnowledgeNote[],
        tasks: (live.tasks ?? []) as NexoraTask[],
        audit: (live.audit ?? []) as AuditEntry[],
      };
    }
    return {
      mode: isAuthenticated ? "founder" : "guest",
      taskCode: ACTIVE_TASK_CODE,
      workspacePath: WORKSPACE_PATH,
      ...guest,
    };
  }, [guest, isAuthenticated, live]);

  const syncing = isAuthenticated && (!live?.authenticated || !live.seeded);
  const activeTask =
    data.tasks.find((task) => task.code === data.taskCode) ??
    data.tasks[0] ??
    null;

  return {
    data,
    activeTask,
    mode: data.mode,
    syncing,
    pending,
    isAuthenticated,
    sendMessage,
    saveKnowledge,
    sendToEngineering,
    approveTask,
    rejectTask,
    applyTask,
  };
}

export type NexoraController = ReturnType<typeof useNexora>;
