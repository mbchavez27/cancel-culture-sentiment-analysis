import { useEffect, useState } from "react";
import type { ReactNode } from "react";

interface Props {
  number: string;
  eyebrow: string;
  title: ReactNode;
  lede: ReactNode;
  children?: ReactNode;
}

export function SectionHead({ number, eyebrow, title, lede, children }: Props) {
  return (
    <header className="section-head reveal">
      <div className="section-head__number" aria-hidden="true">
        {number}
      </div>
      <div className="section-head__body">
        <div className="eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
        <p className="section-head__lede">{lede}</p>
        {children}
      </div>
    </header>
  );
}

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      frame = 0;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <div className="scroll-progress" aria-hidden="true">
      <span style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}
