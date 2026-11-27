import { useEffect, useState } from "react";
import { useCase } from "../context/CaseContext";
import { fmtCompact } from "../lib/format";

const SECTIONS = [
  { id: "design", label: "Design", number: "00" },
  { id: "collect", label: "Collect", number: "01" },
  { id: "preprocess", label: "Clean", number: "02" },
  { id: "sentiment", label: "Sentiment", number: "03" },
  { id: "network", label: "Network", number: "04" },
  { id: "evaluate", label: "Evaluate", number: "05" },
  { id: "findings", label: "Findings", number: "06" },
];

export function SiteNav() {
  const { caseKey, caseData, setCaseKey } = useCase();
  const [active, setActive] = useState("design");

  useEffect(() => {
    const targets = [
      document.getElementById("top"),
      ...SECTIONS.map((section) => document.getElementById(section.id)),
    ].filter((element): element is HTMLElement => Boolean(element));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActive(visible[0].target.id === "top" ? "design" : visible[0].target.id);
        }
      },
      { rootMargin: "-22% 0px -62% 0px", threshold: [0, 0.1, 0.4] },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return (
    <header className="site-nav">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="site-nav__inner">
        <a className="wordmark" href="#top" aria-label="Anatomy of a Cancellation, back to top">
          <span className="wordmark__mark" aria-hidden="true" />
          <span className="wordmark__text">
            Anatomy <span>of a</span> Cancellation
          </span>
        </a>

        <nav className="section-nav" aria-label="Pipeline sections">
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={active === section.id ? "is-active" : undefined}
              aria-current={active === section.id ? "true" : undefined}
            >
              <span>{section.number}</span>
              {section.label}
            </a>
          ))}
        </nav>

        <div className="case-switch" role="group" aria-label="Choose case study">
          {(["bodeoum_tv", "mimiminu"] as const).map((key) => (
            <button
              key={key}
              type="button"
              className={caseKey === key ? "is-active" : undefined}
              onClick={() => setCaseKey(key)}
              aria-pressed={caseKey === key}
              title={`Show ${key === "bodeoum_tv" ? "Bodeoum TV" : "Mimiminu"}`}
            >
              <span className={`case-dot case-dot--${key === "bodeoum_tv" ? "oxide" : "slate"}`} />
              <span>{key === "bodeoum_tv" ? "Bodeoum" : "Mimiminu"}</span>
              <b>{fmtCompact(key === "bodeoum_tv" ? 128532 : 16748)}</b>
            </button>
          ))}
        </div>
      </div>
      <div className="site-nav__case-line" aria-live="polite">
        <span>Now viewing</span>
        <strong>{caseData.name}</strong>
        <span className="site-nav__case-role">{caseData.role}</span>
      </div>
    </header>
  );
}
