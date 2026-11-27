import type { ReactNode } from "react";

export function StepCopy({
  number,
  label,
  title,
  lede,
  children,
}: {
  number: string;
  label: string;
  title: ReactNode;
  lede: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="step-copy">
      <p className="kicker">
        <span>{number}</span> / {label}
      </p>
      <h2 tabIndex={-1}>{title}</h2>
      <p className="lede">{lede}</p>
      {children}
    </div>
  );
}

export function Viz({
  title,
  meta,
  children,
  foot,
}: {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  foot?: ReactNode;
}) {
  return (
    <div className="viz">
      <div className="viz__head">
        <span className="viz__title">{title}</span>
        {meta ? <span className="viz__meta">{meta}</span> : null}
      </div>
      <div className="viz__body">{children}</div>
      {foot ? <div className="viz__foot">{foot}</div> : null}
    </div>
  );
}

export function Point({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="point">
      <span className="point__label">{label}</span>
      <p>{children}</p>
    </div>
  );
}

export function Callout({ children }: { children: ReactNode }) {
  return <div className="callout">{children}</div>;
}
