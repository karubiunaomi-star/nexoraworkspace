import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
  ACTIVE_TASK_CODE,
  WORKSPACE_PATH,
  planReply,
  seedAudit,
  seedKnowledge,
  seedMessages,
  seedSources,
  seedTasks,
} from "./nexoraSeed";

/**
 * Nexora workspace backend.
 *
 * Authorization model (server-derived, never trusted from the client):
 *   - every row carries the signed-in owner id;
 *   - only the owner can read or mutate their workspace;
 *   - the plan engine is not an authenticated principal, so it cannot approve
 *     or execute its own proposal;
 *   - `applyTask` requires a persisted founder approval, not just a UI flag;
 *   - every state change writes an audit row.
 */

type AnyCtx = QueryCtx | MutationCtx;

async function requireUser(ctx: AnyCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error(
      "UNAUTHORIZED: a signed-in founder session is required for this operation.",
    );
  }
  return userId;
}

async function actorName(ctx: AnyCtx, userId: Awaited<ReturnType<typeof requireUser>>) {
  const user = await ctx.db.get(userId);
  if (!user) return "Founder";
  if (user.name) return user.name;
  if (user.email) return user.email;
  if (user.isAnonymous) return "Guest founder";
  return "Founder";
}

async function audit(
  ctx: MutationCtx,
  ownerId: Awaited<ReturnType<typeof requireUser>>,
  actor: string,
  action:
    | "workspace.seeded"
    | "message.sent"
    | "task.proposed"
    | "task.sent_to_engineering"
    | "task.approved"
    | "task.rejected"
    | "task.applied"
    | "knowledge.saved",
  detail: string,
) {
  await ctx.db.insert("nexoraAudit", {
    ownerId,
    actor,
    action,
    detail,
    at: Date.now(),
  });
}

const emptyWorkspace = {
  authenticated: false,
  seeded: false,
  taskCode: ACTIVE_TASK_CODE,
  workspacePath: WORKSPACE_PATH,
  messages: [],
  sources: [],
  knowledge: [],
  tasks: [],
  audit: [],
};

export const workspace = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return emptyWorkspace;

    const workspaceDoc = await ctx.db
      .query("nexoraWorkspaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .unique();

    const [messages, sources, knowledge, tasks, auditRows] = await Promise.all([
      ctx.db
        .query("nexoraMessages")
        .withIndex("by_owner", (q) => q.eq("ownerId", userId))
        .collect(),
      ctx.db
        .query("nexoraSources")
        .withIndex("by_owner", (q) => q.eq("ownerId", userId))
        .collect(),
      ctx.db
        .query("nexoraKnowledge")
        .withIndex("by_owner", (q) => q.eq("ownerId", userId))
        .collect(),
      ctx.db
        .query("nexoraTasks")
        .withIndex("by_owner", (q) => q.eq("ownerId", userId))
        .collect(),
      ctx.db
        .query("nexoraAudit")
        .withIndex("by_owner", (q) => q.eq("ownerId", userId))
        .collect(),
    ]);

    return {
      authenticated: true,
      seeded: workspaceDoc !== null,
      taskCode: workspaceDoc?.taskCode ?? ACTIVE_TASK_CODE,
      workspacePath: workspaceDoc?.workspacePath ?? WORKSPACE_PATH,
      messages: messages
        .sort((a, b) => a.at - b.at)
        .map((m) => ({
          id: m._id as string,
          role: m.role,
          content: m.content,
          at: m.at,
          attachments: m.attachments,
        })),
      sources: sources.map((s) => ({
        id: s._id as string,
        title: s.title,
        url: s.url,
        status: s.status,
        detail: s.detail,
      })),
      knowledge: knowledge
        .sort((a, b) => b.at - a.at)
        .map((k) => ({
          id: k._id as string,
          title: k.title,
          body: k.body,
          tag: k.tag,
          at: k.at,
        })),
      tasks: tasks
        .sort((a, b) => b._creationTime - a._creationTime)
        .map((t) => ({
          id: t._id as string,
          code: t.code,
          title: t.title,
          summary: t.summary,
          status: t.status,
          sentToEngineering: t.sentToEngineering,
          filePath: t.filePath,
          before: t.before,
          after: t.after,
          plan: t.plan,
          proposedBy: t.proposedBy,
          approvedBy: t.approvedBy,
          approvedAt: t.approvedAt,
          appliedAt: t.appliedAt,
        })),
      audit: auditRows
        .sort((a, b) => b.at - a.at)
        .map((a) => ({
          id: a._id as string,
          actor: a.actor,
          action: a.action,
          detail: a.detail,
          at: a.at,
        })),
    };
  },
});

/** Idempotent: creates the founder's workspace and its seed content once. */
export const ensureWorkspace = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("nexoraWorkspaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .unique();
    if (existing) return { created: false };

    const now = Date.now();
    await ctx.db.insert("nexoraWorkspaces", {
      ownerId: userId,
      taskCode: ACTIVE_TASK_CODE,
      workspacePath: WORKSPACE_PATH,
      seededAt: now,
    });

    for (const message of seedMessages(now)) {
      await ctx.db.insert("nexoraMessages", {
        ownerId: userId,
        role: message.role,
        content: message.content,
        at: message.at,
        attachments: message.attachments,
      });
    }
    for (const source of seedSources()) {
      await ctx.db.insert("nexoraSources", { ownerId: userId, ...source });
    }
    for (const note of seedKnowledge(now)) {
      await ctx.db.insert("nexoraKnowledge", { ownerId: userId, ...note });
    }
    for (const task of seedTasks()) {
      await ctx.db.insert("nexoraTasks", { ownerId: userId, ...task });
    }
    for (const entry of seedAudit(now)) {
      await ctx.db.insert("nexoraAudit", { ownerId: userId, ...entry });
    }

    return { created: true };
  },
});

export const sendMessage = mutation({
  args: {
    content: v.string(),
    attachments: v.optional(
      v.array(
        v.object({
          name: v.string(),
          kind: v.union(v.literal("file"), v.literal("link")),
          status: v.union(
            v.literal("indexed"),
            v.literal("read-only"),
            v.literal("attached"),
            v.literal("unverified"),
            v.literal("cached"),
            v.literal("unavailable"),
          ),
          detail: v.string(),
          href: v.optional(v.string()),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const content = args.content.trim();
    if (!content) throw new Error("A message cannot be empty.");
    if (content.length > 4000) throw new Error("Message is too long.");

    const now = Date.now();
    const actor = await actorName(ctx, userId);
    const attachments = args.attachments ?? [];

    await ctx.db.insert("nexoraMessages", {
      ownerId: userId,
      role: "user",
      content,
      at: now,
      attachments,
    });
    await ctx.db.insert("nexoraMessages", {
      ownerId: userId,
      role: "assistant",
      content: planReply(content),
      at: now + 1,
      attachments: [],
    });
    await audit(
      ctx,
      userId,
      actor,
      "message.sent",
      `Prompt sent to the plan engine · ${content.length} chars · ${attachments.length} attachment(s)`,
    );
    return { ok: true };
  },
});

export const proposeTask = mutation({
  args: {
    title: v.string(),
    summary: v.string(),
    filePath: v.string(),
    before: v.string(),
    after: v.string(),
    plan: v.array(v.string()),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if (!args.title.trim()) throw new Error("A task title is required.");
    const actor = await actorName(ctx, userId);

    await ctx.db.insert("nexoraTasks", {
      ownerId: userId,
      code: args.code,
      title: args.title.trim(),
      summary: args.summary.trim(),
      status: "proposed",
      sentToEngineering: true,
      filePath: args.filePath,
      before: args.before,
      after: args.after,
      plan: args.plan,
      proposedBy: "NEXORA plan engine",
    });
    await audit(
      ctx,
      userId,
      "NEXORA plan engine",
      "task.proposed",
      `${args.code} proposed · ${args.filePath}`,
    );
    await audit(
      ctx,
      userId,
      actor,
      "task.sent_to_engineering",
      `${args.code} routed to Engineering for review`,
    );
    return { ok: true };
  },
});

export const sendToEngineering = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const task = await ctx.db
      .query("nexoraTasks")
      .withIndex("by_owner_code", (q) =>
        q.eq("ownerId", userId).eq("code", args.code),
      )
      .unique();
    if (!task) throw new Error("Task not found in this workspace.");
    if (task.sentToEngineering) return { ok: true, alreadySent: true };

    await ctx.db.patch(task._id, { sentToEngineering: true });
    await audit(
      ctx,
      userId,
      await actorName(ctx, userId),
      "task.sent_to_engineering",
      `${task.code} routed to Engineering for review`,
    );
    return { ok: true, alreadySent: false };
  },
});

export const approveTask = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const task = await ctx.db
      .query("nexoraTasks")
      .withIndex("by_owner_code", (q) =>
        q.eq("ownerId", userId).eq("code", args.code),
      )
      .unique();
    if (!task) throw new Error("Task not found in this workspace.");
    if (task.status === "approved" || task.status === "applied") {
      throw new Error("This change has already been approved.");
    }
    if (task.status === "rejected") {
      throw new Error("A rejected change cannot be approved.");
    }
    if (task.status !== "proposed") {
      throw new Error("This change is not awaiting approval.");
    }

    const actor = await actorName(ctx, userId);
    await ctx.db.patch(task._id, {
      status: "approved",
      approvedBy: actor,
      approvedAt: Date.now(),
    });
    await audit(
      ctx,
      userId,
      actor,
      "task.approved",
      `${task.code} approved by ${actor}·${userId.slice(-6)}`,
    );
    return { ok: true, approvedBy: actor };
  },
});

export const rejectTask = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const task = await ctx.db
      .query("nexoraTasks")
      .withIndex("by_owner_code", (q) =>
        q.eq("ownerId", userId).eq("code", args.code),
      )
      .unique();
    if (!task) throw new Error("Task not found in this workspace.");
    if (task.status === "applied") throw new Error("An applied change cannot be rejected.");

    const actor = await actorName(ctx, userId);
    await ctx.db.patch(task._id, { status: "rejected" });
    await audit(ctx, userId, actor, "task.rejected", `${task.code} rejected by ${actor}`);
    return { ok: true };
  },
});

/**
 * Execution. This is deliberately separate from approval: it re-reads the
 * persisted approval, checks the approver identity, and refuses unapproved
 * tasks. There is no shell access and no repository write here.
 */
export const applyTask = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const task = await ctx.db
      .query("nexoraTasks")
      .withIndex("by_owner_code", (q) =>
        q.eq("ownerId", userId).eq("code", args.code),
      )
      .unique();
    if (!task) throw new Error("Task not found in this workspace.");
    if (task.status === "proposed") {
      throw new Error("APPROVAL_REQUIRED: a founder must approve this change before it can be applied.");
    }
    if (task.status === "rejected") {
      throw new Error("A rejected change cannot be applied.");
    }
    if (task.status === "applied") {
      throw new Error("This change has already been applied.");
    }
    if (task.status !== "approved" || !task.approvedBy) {
      throw new Error("APPROVAL_REQUIRED: no persisted founder approval exists.");
    }
    if (task.approvedBy.toLowerCase().includes("plan engine")) {
      throw new Error("SEPARATION_OF_DUTIES: the plan engine cannot execute its own proposal.");
    }

    const actor = await actorName(ctx, userId);
    await ctx.db.patch(task._id, {
      status: "applied",
      appliedAt: Date.now(),
    });
    await audit(
      ctx,
      userId,
      actor,
      "task.applied",
      `${task.code} applied to the workspace buffer (repository unchanged)`,
    );
    return { ok: true, filePath: task.filePath, appliedBy: actor };
  },
});

export const saveKnowledge = mutation({
  args: { title: v.string(), body: v.string(), tag: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const title = args.title.trim();
    const body = args.body.trim();
    if (!title || !body) throw new Error("A knowledge note needs a title and body.");
    if (title.length > 120 || body.length > 2000) {
      throw new Error("Knowledge note is too long.");
    }

    const now = Date.now();
    await ctx.db.insert("nexoraKnowledge", {
      ownerId: userId,
      title,
      body,
      tag: (args.tag ?? "NOTE").trim().slice(0, 24).toUpperCase() || "NOTE",
      at: now,
    });
    await audit(
      ctx,
      userId,
      await actorName(ctx, userId),
      "knowledge.saved",
      `Knowledge note saved · ${title}`,
    );
    return { ok: true };
  },
});
