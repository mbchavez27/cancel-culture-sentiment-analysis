import { useEffect, useState } from "react";
import { useCase } from "../../context/CaseContext";
import { fmtInt } from "../../lib/format";
import { StepCopy, Viz } from "../parts";

type Tab = "clean" | "dedup";

export function CleanStep() {
  const { data, caseData } = useCase();
  const [tab, setTab] = useState<Tab>("clean");
  const [exampleIndex, setExampleIndex] = useState(0);

  useEffect(() => {
    setTab("clean");
    setExampleIndex(0);
  }, [caseData.id]);

  const example = caseData.cleaningExamples[exampleIndex];
  const dedup = caseData.dedup;

  return (
    <section className="step">
      <StepCopy
        number="03"
        label="Clean"
        title={
          <>
            Clean the <em>text.</em>
          </>
        }
        lede="Strip links and empty comments. Drop exact repeats from the same author within 60 seconds."
      >
        <div className="funnel" aria-label="Comment cleaning counts">
          <div>
            <strong>{fmtInt(data.meta.raw)}</strong>
            <span>collected</span>
          </div>
          <i aria-hidden="true">−</i>
          <div>
            <strong>{fmtInt(data.meta.empty)}</strong>
            <span>empty</span>
          </div>
          <i aria-hidden="true">−</i>
          <div>
            <strong>{fmtInt(data.meta.duplicates)}</strong>
            <span>duplicates</span>
          </div>
          <i aria-hidden="true">=</i>
          <div className="funnel__result">
            <strong>{fmtInt(data.meta.analyzed)}</strong>
            <span>analyzed</span>
          </div>
        </div>
      </StepCopy>

      <Viz
        title={tab === "clean" ? "One comment, before and after" : "Exact duplicates"}
        meta={`${caseData.empty} empty · ${caseData.duplicates} duplicates`}
        foot={
          tab === "clean"
            ? "Deduplication only catches exact cleaned text; paraphrases and near-duplicates remain."
            : "The later copy is dropped, not the earlier one. Nothing is merged across authors."
        }
      >
        <div className="segmented" role="tablist" aria-label="Cleaning artifacts">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "clean"}
            className={`segment ${tab === "clean" ? "is-active" : ""}`}
            onClick={() => setTab("clean")}
          >
            Text cleaning
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "dedup"}
            className={`segment ${tab === "dedup" ? "is-active" : ""}`}
            onClick={() => setTab("dedup")}
          >
            Deduplication
          </button>
        </div>

        {tab === "clean" ? (
          <>
            <div className="example-nav">
              <span>
                Example {exampleIndex + 1} / {caseData.cleaningExamples.length} · {example.label}
              </span>
              <button
                type="button"
                className="small-button"
                onClick={() =>
                  setExampleIndex((current) => (current + 1) % caseData.cleaningExamples.length)
                }
              >
                Next example →
              </button>
            </div>

            <div className="code-pair">
              <div>
                <p className="code-pair__label">raw</p>
                <pre>{example.raw}</pre>
              </div>
              <div>
                <p className="code-pair__label">text_clean</p>
                <pre>{example.clean}</pre>
              </div>
            </div>

            <div className="tag-row">
              {example.operations.map((operation) => (
                <span key={operation} className="op-tag">
                  {operation}
                </span>
              ))}
              <span className="op-tag op-tag--muted">
                {example.raw.length} → {example.clean.length} chars
              </span>
            </div>
            <p className="translation">“{example.translation}”</p>
          </>
        ) : (
          <div className="dedup-card">
            <div className="dedup-card__meta">
              <span>@{dedup.author}</span>
              <span>{dedup.slot}</span>
              <span>same timestamp</span>
            </div>
            <p className="dedup-card__text">“{dedup.text}”</p>
            <div className="dedup-card__pair">
              <div className="dedup-card__item is-kept">
                <span>kept</span>
                <code>{dedup.keptId}</code>
              </div>
              <div className="dedup-card__item is-dropped">
                <span>dropped</span>
                <code>{dedup.droppedId}</code>
              </div>
            </div>
            <p className="translation">{dedup.note}</p>
          </div>
        )}
      </Viz>
    </section>
  );
}
