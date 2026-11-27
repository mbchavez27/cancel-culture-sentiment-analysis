import { useEffect, useState } from "react";
import { useCase } from "../context/CaseContext";
import { fmtInt } from "../lib/format";
import { SectionHead } from "./SectionHead";
import { AnimatedNumber } from "./AnimatedNumber";
import { Artifact, Callout, Tag } from "./ui/Primitives";

function CleaningLab() {
  const { caseData } = useCase();
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [caseData.id]);
  const example = caseData.cleaningExamples[index];
  const changed = example.raw.length - example.clean.length;

  return (
    <div className="cleaning-lab">
      <div className="cleaning-lab__head">
        <div>
          <span className="eyebrow">Cleaning lab / real comment</span>
          <h3>Watch the string change.</h3>
        </div>
        <div className="cleaning-lab__tabs" role="tablist" aria-label="Cleaning examples">
          {caseData.cleaningExamples.map((item, itemIndex) => (
            <button
              key={item.label}
              type="button"
              role="tab"
              aria-selected={index === itemIndex}
              className={index === itemIndex ? "is-active" : undefined}
              onClick={() => setIndex(itemIndex)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="cleaning-lab__grid" aria-live="polite">
        <div className="cleaning-pane">
          <div className="cleaning-pane__bar">
            <span>Raw comment</span>
            <span>{example.raw.length} chars</span>
          </div>
          <pre>{example.raw}</pre>
        </div>
        <div className="cleaning-arrow" aria-hidden="true">
          <span>clean</span>
          <i>→</i>
        </div>
        <div className="cleaning-pane cleaning-pane--clean">
          <div className="cleaning-pane__bar">
            <span>text_clean</span>
            <span>{example.clean.length} chars</span>
          </div>
          <pre>{example.clean}</pre>
        </div>
      </div>

      <div className="cleaning-lab__foot">
        <div className="cleaning-lab__ops">
          {example.operations.map((operation) => (
            <Tag key={operation} tone="oxide">
              {operation}
            </Tag>
          ))}
          {changed > 0 && <span className="cleaning-lab__delta">{changed} characters removed</span>}
        </div>
        <p>{example.note}</p>
        <p className="cleaning-lab__gloss">
          <span>English gloss</span> {example.translation}
        </p>
        <Artifact path={`02-preprocessing/outputs/${caseData.id}/comments.csv`} label="Saved in" />
      </div>
    </div>
  );
}

function DedupDemo() {
  const { data, caseData } = useCase();
  const { dedup } = caseData;
  return (
    <div className="dedup-demo">
      <div className="dedup-demo__head">
        <div>
          <span className="eyebrow">Deduplication / exact repeats</span>
          <h3>Same author. Same text. Same moment.</h3>
        </div>
        <div className="dedup-demo__count">
          <strong>{fmtInt(caseData.duplicates)}</strong>
          <span>removed from this case</span>
        </div>
      </div>

      <div className="dedup-demo__cards">
        <div className="dedup-card">
          <div className="dedup-card__bar">
            <span>{dedup.author}</span>
            <Tag tone="moss">Kept</Tag>
          </div>
          <p>{dedup.text}</p>
          <code>{dedup.keptId.slice(-18)}</code>
        </div>
        <div className="dedup-card dedup-card--dropped">
          <div className="dedup-card__bar">
            <span>{dedup.author}</span>
            <Tag tone="oxide">Removed</Tag>
          </div>
          <p>{dedup.text}</p>
          <code>{dedup.droppedId.slice(-18)}</code>
        </div>
      </div>

      <p className="dedup-demo__note">
        The rule is conservative: the same <code>author_id</code>, the same{" "}
        <code>text_clean</code>, within 60 seconds. A different viewer posting the same
        sentence is kept. Across both cases, {fmtInt(data.meta.duplicates)}{" "}
        exact duplicates were dropped.
      </p>
    </div>
  );
}

function Waterfall() {
  const { data, caseData } = useCase();
  const steps = [
    { label: "Collected", value: caseData.raw, kind: "total" },
    { label: "Empty after cleaning", value: -caseData.empty, kind: "minus" },
    { label: "Non-empty", value: caseData.nonEmpty, kind: "total" },
    { label: "Exact duplicates", value: -caseData.duplicates, kind: "minus" },
    { label: "Analyzed", value: caseData.analyzed, kind: "final" },
  ];
  return (
    <div className="funnel">
      <div className="funnel__head">
        <div>
          <span className="eyebrow">The row count, audited</span>
          <h3>Nothing disappears silently.</h3>
        </div>
        <div className="funnel__total">
          <span>All cases</span>
          <strong>
            <AnimatedNumber
              value={data.meta.analyzed}
              format={(value) => fmtInt(Math.round(value))}
            />
          </strong>
          <small>comments analyzed</small>
        </div>
      </div>

      <div className="funnel__steps">
        {steps.map((step) => (
          <div className={`funnel-step funnel-step--${step.kind}`} key={step.label}>
            <span className="funnel-step__label">{step.label}</span>
            <span className="funnel-step__value">
              {step.kind === "minus" ? "−" : ""}
              {fmtInt(Math.abs(step.value))}
            </span>
            <div className="funnel-step__track">
              {step.kind !== "minus" && (
                <span style={{ width: `${(Math.abs(step.value) / caseData.raw) * 100}%` }} />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="funnel__split">
        <div>
          <span>Bodeoum TV</span>
          <strong>{fmtInt(data.cases.bodeoum_tv.raw)} → {fmtInt(data.cases.bodeoum_tv.analyzed)}</strong>
          <small>{fmtInt(data.cases.bodeoum_tv.empty)} empty · {fmtInt(data.cases.bodeoum_tv.duplicates)} duplicates</small>
        </div>
        <div>
          <span>Mimiminu</span>
          <strong>{fmtInt(data.cases.mimiminu.raw)} → {fmtInt(data.cases.mimiminu.analyzed)}</strong>
          <small>{fmtInt(data.cases.mimiminu.empty)} empty · {fmtInt(data.cases.mimiminu.duplicates)} duplicates</small>
        </div>
        <div className="funnel__removed">
          <span>Removed overall</span>
          <strong>{(((data.meta.raw - data.meta.analyzed) / data.meta.raw) * 100).toFixed(2)}%</strong>
          <small>{fmtInt(data.meta.raw - data.meta.analyzed)} rows</small>
        </div>
      </div>
    </div>
  );
}

export function PreprocessSection() {
  const { caseData } = useCase();
  const example = caseData.cleaningExamples[1] ?? caseData.cleaningExamples[0];
  return (
    <section className="section section--preprocess" id="preprocess">
      <div className="container">
        <SectionHead
          number="02"
          eyebrow="Preprocess"
          title={
            <>
              The comment is the unit.
              <br />
              Cleaning is the <em>audit</em>.
            </>
          }
          lede={
            <>
              Before sentiment or networks, every comment passes through the same
              documented cleaning path. URLs and empty rows are removed, whitespace is
              normalized, and exact repeats from the same author are collapsed. The
              point is not to make comments polite; it is to make the unit consistent.
            </>
          }
        />

        <div className="clean-ops reveal" aria-label="Cleaning operations">
          {[
            ["01", "Strip", "zero-width characters, HTML entities, URLs"],
            ["02", "Keep", "Hangul, Latin, digits, punctuation, emoji"],
            ["03", "Normalize", "line breaks, repeated spaces, Korean spacing"],
            ["04", "Deduplicate", "same author + text within 60 seconds"],
          ].map(([number, label, detail]) => (
            <div key={label}>
              <span>{number}</span>
              <strong>{label}</strong>
              <small>{detail}</small>
            </div>
          ))}
        </div>

        <div className="section-block reveal">
          <CleaningLab />
        </div>

        <div className="section-block reveal">
          <DedupDemo />
        </div>

        <div className="section-block reveal">
          <Waterfall />
        </div>

        <div className="schema reveal">
          <div className="schema__head">
            <span className="eyebrow">What goes downstream</span>
            <h3>One row, six fields that matter.</h3>
          </div>
          <div className="schema__table" role="table" aria-label="Preprocessed comment schema">
            <div className="schema__row schema__row--head" role="row">
              <span role="columnheader">Field</span>
              <span role="columnheader">Example from this case</span>
              <span role="columnheader">Used for</span>
            </div>
            {[
              ["comment_id", caseData.dedup.keptId, "unique row / thread reconstruction"],
              ["parent_id", "root or another comment_id", "reply edges"],
              ["author_id", caseData.rawComment.author_id, "author nodes"],
              ["text_clean", example.clean, "sentiment model"],
              ["window / slot", `${example.slot} / ${example.slot}`, "grouping and time"],
              ["timestamp", String(caseData.rawComment.timestamp), "ordering and dedup"],
            ].map(([field, value, use]) => (
              <div className="schema__row" role="row" key={field}>
                <code role="cell">{field}</code>
                <span role="cell" className="schema__value">{value}</span>
                <span role="cell" className="schema__use">{use}</span>
              </div>
            ))}
          </div>
          <Artifact path={`02-preprocessing/outputs/${caseData.id}/comments.csv`} />
        </div>

        <div className="preprocess-notes reveal">
          <Callout title="What cleaning does not do" tone="warn">
            <p>
              It does not translate, summarize, remove criticism, detect sarcasm, or
              correct spelling. Emoji survive. A comment that says something harsh stays
              harsh; the model, not the cleaner, decides what to do with it.
            </p>
          </Callout>
          <Callout title="Conservative by design" tone="key">
            <p>
              Deduplication only removes exact repeats from the same author within a
              minute. It is meant to catch posting glitches and repeated submissions, not
              to collapse genuine agreement between different people.
            </p>
          </Callout>
        </div>
      </div>
    </section>
  );
}
