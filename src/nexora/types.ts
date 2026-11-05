/**
 * Nexora workspace model.
 *
 * These shapes are shared by the local guest preview and by the Convex-backed
 * workspace. The Convex query maps document ids to strings so the panes do not
 * care which source they are reading.
 */

export type WorkspaceMode = "guest" | "founder";

export type AttachmentStatus =
  | "indexed"
  | "read-only"
  | "attached"
  | "unverified"
  | "cached"
  | "unavailable";

export type Attachment = {
  name: string;
  kind: "file" | "link";
  status: AttachmentStatus;
  detail: string;
  href?: string;
};

export type MessageRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  at: number;
  attachments?: Attachment[];
};

export type SourceStatus = "indexed" | "unverified" | "cached" | "unavailable";

export type WorkspaceSource = {
  id: string;
  title: string;
  url: string;
  status: SourceStatus;
  detail: string;
};

export type KnowledgeNote = {
  id: string;
  title: string;
  body: string;
  tag: string;
  at: number;
};

export type TaskStatus = "proposed" | "approved" | "applied" | "rejected";

export type NexoraTask = {
  id: string;
  code: string;
  title: string;
  summary: string;
  status: TaskStatus;
  sentToEngineering: boolean;
  filePath: string;
  before: string;
  after: string;
  plan: string[];
  proposedBy: string;
  approvedBy?: string;
  approvedAt?: number;
  appliedAt?: number;
};

export type AuditAction =
  | "workspace.seeded"
  | "message.sent"
  | "task.proposed"
  | "task.sent_to_engineering"
  | "task.approved"
  | "task.rejected"
  | "task.applied"
  | "knowledge.saved";

export type AuditEntry = {
  id: string;
  actor: string;
  action: AuditAction;
  detail: string;
  at: number;
};

export type WorkspaceData = {
  mode: WorkspaceMode;
  taskCode: string;
  workspacePath: string;
  messages: ChatMessage[];
  sources: WorkspaceSource[];
  knowledge: KnowledgeNote[];
  tasks: NexoraTask[];
  audit: AuditEntry[];
};

export type WorkspacePiece = Omit<WorkspaceData, "mode" | "taskCode" | "workspacePath">;
