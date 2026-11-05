import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // ── NEXORA workspace ────────────────────────────────────────────────
    // One workspace per signed-in founder. Every row is owner-scoped and the
    // approval/execution mutations re-check that ownership server-side.
    nexoraWorkspaces: defineTable({
      ownerId: v.id("users"),
      taskCode: v.string(),
      workspacePath: v.string(),
      seededAt: v.number(),
    }).index("by_owner", ["ownerId"]),

    nexoraMessages: defineTable({
      ownerId: v.id("users"),
      role: v.union(
        v.literal("user"),
        v.literal("assistant"),
        v.literal("system"),
      ),
      content: v.string(),
      at: v.number(),
      attachments: v.array(
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
    }).index("by_owner", ["ownerId"]),

    nexoraSources: defineTable({
      ownerId: v.id("users"),
      title: v.string(),
      url: v.string(),
      status: v.union(
        v.literal("indexed"),
        v.literal("unverified"),
        v.literal("cached"),
        v.literal("unavailable"),
      ),
      detail: v.string(),
    }).index("by_owner", ["ownerId"]),

    nexoraKnowledge: defineTable({
      ownerId: v.id("users"),
      title: v.string(),
      body: v.string(),
      tag: v.string(),
      at: v.number(),
    }).index("by_owner", ["ownerId"]),

    nexoraTasks: defineTable({
      ownerId: v.id("users"),
      code: v.string(),
      title: v.string(),
      summary: v.string(),
      status: v.union(
        v.literal("proposed"),
        v.literal("approved"),
        v.literal("applied"),
        v.literal("rejected"),
      ),
      sentToEngineering: v.boolean(),
      filePath: v.string(),
      before: v.string(),
      after: v.string(),
      plan: v.array(v.string()),
      proposedBy: v.string(),
      approvedBy: v.optional(v.string()),
      approvedAt: v.optional(v.number()),
      appliedAt: v.optional(v.number()),
    })
      .index("by_owner", ["ownerId"])
      .index("by_owner_code", ["ownerId", "code"]),

    nexoraAudit: defineTable({
      ownerId: v.id("users"),
      actor: v.string(),
      action: v.union(
        v.literal("workspace.seeded"),
        v.literal("message.sent"),
        v.literal("task.proposed"),
        v.literal("task.sent_to_engineering"),
        v.literal("task.approved"),
        v.literal("task.rejected"),
        v.literal("task.applied"),
        v.literal("knowledge.saved"),
      ),
      detail: v.string(),
      at: v.number(),
    }).index("by_owner", ["ownerId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
