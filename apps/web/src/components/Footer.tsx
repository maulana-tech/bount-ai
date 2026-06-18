import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-10 sm:flex-row sm:items-center">
        <Logo />
        <p className="font-mono text-xs text-ink-faint">
          bount-AI · Autonomous Spending Agent
        </p>
      </div>
    </footer>
  );
}
