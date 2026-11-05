import layoutSource from "./layout.ts?raw";
import typesSource from "./types.ts?raw";
import dataSource from "./data.ts?raw";
import requireAuthSource from "@/components/RequireAuth.tsx?raw";
import themeSource from "@/index.css?raw";
import nexoraSource from "@/convex/nexora.ts?raw";

export type WorkspaceFile = {
  path: string;
  language: string;
  content: string;
  status: "read-only" | "patch-ready";
};

/**
 * Read-only snapshots of real repository files. The Code pane never pretends
 * these are writable: a proposal is applied to an in-app buffer only and the
 * Report tab says so.
 */
export const WORKSPACE_FILES: WorkspaceFile[] = [
  {
    path: "src/nexora/layout.ts",
    language: "TypeScript",
    content: layoutSource,
    status: "patch-ready",
  },
  {
    path: "src/nexora/types.ts",
    language: "TypeScript",
    content: typesSource,
    status: "read-only",
  },
  {
    path: "src/nexora/data.ts",
    language: "TypeScript",
    content: dataSource,
    status: "read-only",
  },
  {
    path: "src/convex/nexora.ts",
    language: "TypeScript · Convex",
    content: nexoraSource,
    status: "read-only",
  },
  {
    path: "src/components/RequireAuth.tsx",
    language: "TSX",
    content: requireAuthSource,
    status: "read-only",
  },
  {
    path: "src/index.css",
    language: "CSS",
    content: themeSource,
    status: "read-only",
  },
];

export function fileLanguage(path: string): string {
  const ext = path.split(".").pop() ?? "";
  if (ext === "tsx") return "TSX";
  if (ext === "ts") return "TypeScript";
  if (ext === "css") return "CSS";
  return ext.toUpperCase();
}
