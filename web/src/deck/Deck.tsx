import { useEffect, useRef, useState, type ReactNode } from "react";
import type { CaseKey } from "../types";
import { useCase } from "../context/CaseContext";
import { IntroStep } from "./steps/Intro";
import { DesignStep } from "./steps/Design";
import { CollectStep } from "./steps/Collect";
import { CleanStep } from "./steps/Clean";
import { SentimentStep } from "./steps/Sentiment";
import { TrajectoryStep } from "./steps/Trajectory";
import { NetworkStep } from "./steps/Network";
import { MetricsStep } from "./steps/Metrics";
import { TestsStep } from "./steps/Tests";
import { CorrelationStep } from "./steps/Correlation";
import { FindingsStep } from "./steps/Findings";
import "./deck.css";

interface Nav {
  next: () => void;
  prev: () => void;
  restart: () => void;
  goTo: (index: number) => void;
}

interface StepDef {
  id: string;
  label: string;
  render: (nav: Nav) => ReactNode;
}

const STEPS: StepDef[] = [
  { id: "start", label: "Start", render: () => <IntroStep /> },
  { id: "design", label: "Setup", render: () => <DesignStep /> },
  { id: "collect", label: "Collect", render: () => <CollectStep /> },
  { id: "clean", label: "Clean", render: () => <CleanStep /> },
  { id: "sentiment", label: "Mood", render: () => <SentimentStep /> },
  { id: "trajectory", label: "Over time", render: () => <TrajectoryStep /> },
  { id: "network", label: "Replies", render: () => <NetworkStep /> },
  { id: "metrics", label: "Shape", render: () => <MetricsStep /> },
  { id: "tests", label: "Tests", render: () => <TestsStep /> },
  { id: "correlation", label: "Link", render: () => <CorrelationStep /> },
  { id: "findings", label: "Findings", render: () => <FindingsStep /> },
];

const CONTENT_STEPS = STEPS.slice(1);
const LAST = STEPS.length - 1;

export function Deck() {
  const { data, caseKey, setCaseKey } = useCase();
  const [index, setIndex] = useState(0);
  const stageRef = useRef<HTMLElement>(null);
  const step = STEPS[index];
  const contentIndex = index;
  const isLast = index === LAST;

  const next = () => setIndex((current) => Math.min(current + 1, LAST));
  const prev = () => setIndex((current) => Math.max(current - 1, 0));
  const restart = () => setIndex(0);
  const goTo = (target: number) => setIndex(Math.max(0, Math.min(target, LAST)));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, select, [contenteditable='true']")
      ) {
        return;
      }
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        next();
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        prev();
      } else if (event.key === "Home") {
        event.preventDefault();
        restart();
      } else if (event.key === "End") {
        event.preventDefault();
        goTo(LAST);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const heading = stageRef.current?.querySelector<HTMLElement>("h1, h2");
    heading?.focus({ preventScroll: true });
  }, [index]);

  return (
    <div className="deck">
      <nav className="deck-progress" aria-label="Walkthrough steps">
        {CONTENT_STEPS.map((item, itemIndex) => {
          const active = itemIndex + 1 === contentIndex;
          const done = itemIndex + 1 < contentIndex;
          return (
            <button
              key={item.id}
              type="button"
              className={`deck-progress__step ${active ? "is-active" : ""} ${done ? "is-done" : ""}`}
              onClick={() => goTo(itemIndex + 1)}
              aria-label={`Step ${itemIndex + 1}: ${item.label}`}
              aria-current={active ? "step" : undefined}
              title={item.label}
            >
              <span aria-hidden="true" />
            </button>
          );
        })}
      </nav>

      <main className="deck-stage" ref={stageRef} tabIndex={-1}>
        <div className="deck-slide" key={index}>
          {step.render({ next, prev, restart, goTo })}
        </div>
      </main>

      <p className="sr-only" aria-live="polite">
        {index === 0 ? "Introduction" : `Step ${contentIndex} of ${CONTENT_STEPS.length}: ${step.label}`}
      </p>

      <footer className="deck-footer">
        <div className="deck-footer__left">
          <div className="case-switch" role="group" aria-label="Choose a case study">
            {(["bodeoum_tv", "mimiminu"] as CaseKey[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`case-switch__button ${caseKey === key ? "is-active" : ""}`}
                aria-pressed={caseKey === key}
                onClick={() => setCaseKey(key)}
              >
                <span className="case-switch__dot" aria-hidden="true" />
                {data.cases[key].short}
              </button>
            ))}
          </div>
          <span className="deck-footer__count">
            {String(contentIndex).padStart(2, "0")} / 10
            {index > 0 ? <strong>{step.label}</strong> : null}
          </span>
        </div>

        <div className="deck-footer__nav">
          <button type="button" className="deck-btn deck-btn--ghost" onClick={prev} disabled={index === 0}>
            Back
          </button>
          <button
            type="button"
            className="deck-btn deck-btn--primary"
            onClick={isLast ? restart : next}
          >
            {index === 0 ? "Start" : isLast ? "Restart" : "Next →"}
          </button>
        </div>
      </footer>
    </div>
  );
}
