import { useEffect, useState } from "react";
import { useCase } from "../context/CaseContext";
import {
  fmtInt,
  fmtPct,
  fmtSignedPct,
  SENTIMENT_LABEL,
  WINDOW_LONG,
  WINDOW_ORDER,
} from "../lib/format";
import { SectionHead } from "./SectionHead";
import { ConfidenceBand } from "./charts/ConfidenceBand";
import { SlotTrajectory } from "./charts/SlotTrajectory";
import { Artifact, Callout, Tag } from "./ui/Primitives";

function SentimentExamples() {
  const { caseData } = useCase();
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [caseData.id]);
  const example = caseData.sentimentExamples[index];
  const tabLabel = (item: (typeof caseData.sentimentExamples)[number], position: number) =>
    position === 3 ? "After" : item.sentiment.charAt(0) + item.sentiment.slice(1).toLowerCase();

  return (
    <div className="sentiment-examples">
      <div className="sentiment-examples__head">
        <div>
          <span className="eyebrow">One comment at a time</span>
          <h3>Read the text. Then read the score.</h3>
        </div>
        <div className="sentiment-examples__tabs" role="tablist" aria-label="Sentiment examples">
          {caseData.sentimentExamples.map((item, itemIndex) => (
            <button
              key={item.label}
              type="button"
              role="tab"
              aria-selected={index === itemIndex}
              className={index === itemIndex ? "is-active" : undefined}
              onClick={() => setIndex(itemIndex)}
            >
              {tabLabel(item, itemIndex)}
            </button>
          ))}
        </div>
      </div>

      <div className="sentiment-card" aria-live="polite">
        <div className="sentiment-card__meta">
          <Tag tone={example.sentiment.toLowerCase()}>{SENTIMENT_LABEL[example.sentiment]}</Tag>
          <span>{example.slot === "cancel-1" ? "apology video" : example.slot.replace("-", " ")}</span>
          <span>{fmtInt(example.likes)} likes on the comment</span>
        </div>
        <blockquote>{example.text}</blockquote>
        <p className="sentiment-card__translation">{example.translation}</p>
        <div className="score-meter">
          <div className="score-meter__labels">
            <span>negative</span>
            <span>neutral band</span>
            <span>positive</span>
          </div>
          <div className="score-meter__track">
            <span className="score-meter__band" />
            <span className="score-meter__fill" style={{ width: `${example.score * 100}%` }} />
            <i style={{ left: `${example.score * 100}%` }} />
          </div>
          <div className="score-meter__value">
            <strong>{example.score.toFixed(3)}</strong>
            <span>confidence</span>
          </div>
        </div>
        <p className="sentiment-card__note">
          <span>Why this label?</span> {example.note}
        </p>
      </div>
    </div>
  );
}

function WindowSummary() {
  const { caseData } = useCase();
  return (
    <div className="window-summary">
      <div className="window-summary__head">
        <div>
          <span className="eyebrow">Pooled by window</span>
          <h3>Three windows, two ways to average.</h3>
        </div>
        <p>
          <b>Pooled</b> weights every comment equally. <b>Slot mean</b> weights every
          video equally. The gap matters when one video dominates the conversation.
        </p>
      </div>
      <div className="window-grid">
        {WINDOW_ORDER.map((window) => {
          const item = caseData.windows[window];
          return (
            <article className={`window-card window-card--${window}`} key={window}>
              <div className="window-card__top">
                <span>{WINDOW_LONG[window]}</span>
                <span>{item.days === 0 ? "1 video" : `${item.days}-day span`}</span>
              </div>
              <div className="window-card__mean">
                <strong>{item.mean.toFixed(3)}</strong>
                <span>pooled mean</span>
              </div>
              <div className="window-card__submean">
                <span>slot mean</span>
                <b>{item.slotMean.toFixed(3)}</b>
              </div>
              <div className="window-card__volume">
                <span>{fmtInt(item.n)} comments</span>
                <span>{fmtPct((item.n / caseData.analyzed) * 100, 1)} of case</span>
              </div>
              <div className="stacked-bar" aria-label={`${WINDOW_LONG[window]} sentiment distribution`}>
                <span
                  className="stacked-bar__pos"
                  style={{ width: `${item.pos}%` }}
                  title={`Positive ${fmtPct(item.pos)}`}
                />
                <span
                  className="stacked-bar__neg"
                  style={{ width: `${item.neg}%` }}
                  title={`Negative ${fmtPct(item.neg)}`}
                />
                <span
                  className="stacked-bar__neu"
                  style={{ width: `${item.neu}%` }}
                  title={`Neutral ${fmtPct(item.neu)}`}
                />
              </div>
              <div className="window-card__pcts">
                <span>{fmtPct(item.pos, 1)} pos</span>
                <span>{fmtPct(item.neg, 1)} neg</span>
                <span>{fmtPct(item.neu, 1)} neu</span>
              </div>
            </article>
          );
        })}
      </div>
      <div className="window-deltas">
        <div>
          <span>Apology vs. before</span>
          <strong className={caseData.recovery.pctCancelVsPre < 0 ? "is-down" : "is-up"}>
            {fmtSignedPct(caseData.recovery.pctCancelVsPre, 2)}
          </strong>
          <small>slot-level mean</small>
        </div>
        <div>
          <span>After vs. before</span>
          <strong className={caseData.recovery.pctPostVsPre > 0 ? "is-up" : "is-down"}>
            {fmtSignedPct(caseData.recovery.pctPostVsPre, 2)}
          </strong>
          <small>slot-level mean</small>
        </div>
        <div>
          <span>Nadir</span>
          <strong>{caseData.recovery.nadirValue.toFixed(3)}</strong>
          <small>{caseData.recovery.nadirSlot} · recovery at {caseData.recovery.recoverySlot}</small>
        </div>
      </div>
    </div>
  );
}

export function SentimentSection() {
  const { caseData, otherCase } = useCase();
  return (
    <section className="section section--sentiment" id="sentiment">
      <div className="container">
        <SectionHead
          number="03"
          eyebrow="Sentiment"
          title={
            <>
              A number is not a feeling.
              <br />
              It is a <em>measurement with rules</em>.
            </>
          }
          lede={
            <>
              Every cleaned comment is passed through a Korean sentiment classifier. The
              model returns a polarity score and a label. The study adds a confidence
              band: when the model is not sure enough, the comment is recorded as
              NEUTRAL. That choice is part of the result.
            </>
          }
        />

        <div className="model-grid">
          <div className="model-card reveal">
            <div className="model-card__top">
              <span className="eyebrow">The classifier</span>
              <span className="model-card__tag">KoELECTRA</span>
            </div>
            <h3>Copycats / koelectra-base-v3</h3>
            <p>
              A Korean sentiment model fine-tuned for positive / negative classification.
              The paper runs it deterministically on cleaned comment text.
            </p>
            <dl className="model-specs">
              <div><dt>Checkpoint</dt><dd>koelectra-base-v3-generalized-sentiment-analysis</dd></div>
              <div><dt>Revision</dt><dd>370f325c…</dd></div>
              <div><dt>Max tokens</dt><dd>512 · truncate from end</dd></div>
              <div><dt>Batch</dt><dd>32 · CPU</dd></div>
              <div><dt>Decision</dt><dd>argmax, no sampling</dd></div>
              <div><dt>Neutral rule</dt><dd>max softmax 0.4–0.6</dd></div>
            </dl>
            <div className="label-counts">
              <span className="eyebrow">Labels in this case</span>
              <div>
                <span><i className="pos" /> Positive <b>{fmtInt(caseData.labelCounts.POSITIVE)}</b></span>
                <span><i className="neg" /> Negative <b>{fmtInt(caseData.labelCounts.NEGATIVE)}</b></span>
                <span><i className="neu" /> Neutral <b>{fmtInt(caseData.labelCounts.NEUTRAL)}</b></span>
              </div>
              <small>
                {fmtPct((caseData.labelCounts.POSITIVE / caseData.analyzed) * 100, 1)} positive ·{" "}
                {fmtPct((caseData.labelCounts.NEGATIVE / caseData.analyzed) * 100, 1)} negative ·{" "}
                {fmtPct((caseData.labelCounts.NEUTRAL / caseData.analyzed) * 100, 1)} neutral
              </small>
            </div>
          </div>
          <div className="reveal">
            <ConfidenceBand examples={caseData.sentimentExamples} />
            <Callout title="The part to remember" tone="key">
              <p>
                The model does not output “neutral” as a separate emotion. It outputs a
                polarity score. The 0.4–0.6 rule deliberately flattens uncertain
                predictions into a third bucket. That keeps overconfident labels out of
                the analysis—and makes NEUTRAL mean “not sure,” not “emotionless.”
              </p>
            </Callout>
          </div>
        </div>

        <div className="section-block reveal">
          <SentimentExamples />
        </div>

        <div className="section-block reveal">
          <SlotTrajectory caseData={caseData} otherCase={otherCase} />
        </div>

        <div className="section-block reveal">
          <WindowSummary />
        </div>

        <div className="sentiment-notes reveal">
          <Callout title="What the score is not" tone="warn">
            <p>
              It is not an emotion, a stance target, or a measure of whether the criticism
              is fair. A negative score can be aimed at the company rather than the
              creator. Sarcasm, quoted speech, and context can all move the number in the
              wrong direction.
            </p>
          </Callout>
          <Callout title="Why both averages" tone="note">
            <p>
              The apology video usually contains most of the comments. A comment-pooled
              window mean is therefore dominated by that one video; a mean of the ten video
              means gives each upload equal weight. The paper reports the pooled version
              and the recovery analysis uses the slot version.
            </p>
          </Callout>
        </div>

        <Artifact path={`03-analysis/outputs/${caseData.id}/sentiment_by_slot.csv`} />
      </div>
    </section>
  );
}
