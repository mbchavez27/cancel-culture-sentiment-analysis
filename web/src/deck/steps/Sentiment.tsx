import { useEffect, useState } from "react";
import { useCase } from "../../context/CaseContext";
import { fmtInt, slotLabel } from "../../lib/format";
import { StepCopy, Viz } from "../parts";

const EXAMPLE_LABELS = ["Positive", "Negative", "Neutral", "After"];

export function SentimentStep() {
  const { caseData } = useCase();
  const [exampleIndex, setExampleIndex] = useState(2);

  useEffect(() => setExampleIndex(2), [caseData.id]);

  const example = caseData.sentimentExamples[exampleIndex];
  const total = Object.values(caseData.labelCounts).reduce((sum, value) => sum + value, 0);
  const labels = [
    { key: "POSITIVE" as const, color: "#5d7654" },
    { key: "NEGATIVE" as const, color: "#b3452e" },
    { key: "NEUTRAL" as const, color: "#b28a45" },
  ];

  return (
    <section className="step">
      <StepCopy
        number="04"
        label="Mood"
        title={
          <>
            Score the <em>mood.</em>
          </>
        }
        lede="A Korean model labels each comment positive, negative, or neutral."
      >
        <div className="label-stack">
          <div className="label-bar" aria-label="Sentiment label distribution">
            {labels.map((label) => (
              <span
                key={label.key}
                style={{
                  width: `${(caseData.labelCounts[label.key] / total) * 100}%`,
                  background: label.color,
                }}
              />
            ))}
          </div>
          <div className="label-stack__legend">
            {labels.map((label) => (
              <span key={label.key}>
                <i style={{ background: label.color }} />
                {label.key.toLowerCase()} {fmtInt(caseData.labelCounts[label.key])}
              </span>
            ))}
          </div>
        </div>
      </StepCopy>

      <Viz
        title="One comment through the classifier"
        meta={`${fmtInt(caseData.analyzed)} comments`}
        foot="Confidence between 0.40 and 0.60 is recorded as neutral."
      >
        <div className="segmented segmented--four" role="tablist" aria-label="Sentiment examples">
          {caseData.sentimentExamples.map((item, index) => (
            <button
              key={`${item.text}-${index}`}
              type="button"
              role="tab"
              aria-selected={exampleIndex === index}
              className={`segment ${exampleIndex === index ? "is-active" : ""}`}
              onClick={() => setExampleIndex(index)}
            >
              {EXAMPLE_LABELS[index] ?? item.kind}
            </button>
          ))}
        </div>

        <div className="comment-card" key={`${example.text}-${exampleIndex}`}>
          <p className="comment-card__ko">{example.text}</p>
          <p className="comment-card__en">“{example.translation}”</p>
          <div className="comment-card__meta">
            <span>{slotLabel(example.slot)}</span>
            <span>{fmtInt(example.likes)} likes</span>
            <span className={`sentiment-chip sentiment-chip--${example.sentiment.toLowerCase()}`}>
              {example.sentiment}
            </span>
          </div>
        </div>

        <div className="confidence">
          <div className="confidence__track">
            <span className="confidence__band" />
            <span className="confidence__marker" style={{ left: `${example.score * 100}%` }} />
          </div>
          <div className="confidence__scale">
            <span>0</span>
            <span>0.40</span>
            <span>0.60</span>
            <span>1</span>
          </div>
          <div className="confidence__readout">
            <span>confidence</span>
            <strong>{example.score.toFixed(3)}</strong>
            <span className="confidence__rule">neutral band 0.40–0.60</span>
          </div>
        </div>

      </Viz>
    </section>
  );
}
