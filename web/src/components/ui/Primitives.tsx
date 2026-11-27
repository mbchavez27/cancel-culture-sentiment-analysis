import type { ReactNode } from "react";

export function Artifact({ path, label = "Artifact" }: { path: string; label?: string }) {
  return (
    <p className="artifact">
      <span>{label}</span>
      <code>{path}</code>
    </p>
  );
}

export function Callout({
  title,
  children,
  tone = "note",
}: {
  title: string;
  children: ReactNode;
  tone?: "note" | "warn" | "key";
}) {
  return (
    <aside className={`callout callout--${tone}`}>
      <span className="callout__label">{title}</span>
      <div>{children}</div>
    </aside>
  );
}

export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: string }) {
  return <span className={`tag tag--${tone}`}>{children}</span>;
}
