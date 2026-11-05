import AuroraDesktop from "@/aurora/AuroraDesktop";

/**
 * Authenticated founder desktop. It uses the exact same Aurora shell and the
 * same single Nexora window; no second workspace or second window manager.
 */
export default function Dashboard() {
  return <AuroraDesktop initialWindowOpen />;
}
