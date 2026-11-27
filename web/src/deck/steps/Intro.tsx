import type { CaseKey } from "../../types";
import { useCase } from "../../context/CaseContext";
import { fmtCompact, fmtInt } from "../../lib/format";

export function IntroStep() {
  const { data, caseKey, setCaseKey } = useCase();
  const cases: CaseKey[] = ["bodeoum_tv", "mimiminu"];

  return (
    <section className="step step--intro">
      <div className="step-copy intro-copy">
        <p className="kicker">FMLDS 2026 · step by step</p>
        <h1 tabIndex={-1}>
          The Dynamics of <em>Cancel Culture</em>
          <span className="paper-title-colon">:</span>
          <span className="paper-title-sub">
            A Social Network and Sentiment Analysis of Influencer Apology Videos in South Korea
          </span>
        </h1>

        <p className="lede">
          Two Korean YouTubers. Two apology videos. 145,280 comments. Follow the method one step at
          a time.
        </p>

        <div className="intro-facts">
          <div>
            <strong>2</strong>
            <span>cases</span>
          </div>
          <div>
            <strong>42</strong>
            <span>videos</span>
          </div>
          <div>
            <strong>{fmtInt(data.meta.analyzed)}</strong>
            <span>comments</span>
          </div>
        </div>

      </div>

      <aside className="intro-panel">
        <p className="intro-panel__label">Choose a case</p>

        <div className="case-picker">
          {cases.map((key) => {
            const item = data.cases[key];
            const active = key === caseKey;
            return (
              <button
                key={key}
                type="button"
                className={`case-option ${active ? "is-active" : ""}`}
                onClick={() => setCaseKey(key)}
                aria-pressed={active}
              >
                <span className="case-option__main">
                  <strong>{item.name}</strong>
                  <span>{item.person}</span>
                  <em>{item.trigger}</em>
                </span>
                <span className="case-option__count">{fmtCompact(item.analyzed)}</span>
              </button>
            );
          })}
        </div>

        <p className="intro-panel__hint">Switch cases at the bottom at any time.</p>
      </aside>
    </section>
  );
}
