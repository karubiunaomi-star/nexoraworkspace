import AuroraDesktop from "@/aurora/AuroraDesktop";

/**
 * Aurora home screen. The single Nexora Workspace window is opened by the
 * existing Aurora window manager and can be minimized, maximized, dragged and
 * closed from its own title bar.
 */
export default function Landing() {
  return <AuroraDesktop initialWindowOpen />;
}
