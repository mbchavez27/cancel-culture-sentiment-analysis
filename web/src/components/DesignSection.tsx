import { useEffect, useState } from "react";
import { useCase } from "../context/CaseContext";
import {
  fmtCompact,
  fmtDate,
  fmtInt,
  fmtPct,
  slotShort,
  WINDOW_LABEL,
  WINDOW_LONG,
} from "../lib/format";
import { SectionHead } from "./SectionHead";
import { Artifact, Callout } from "./ui/Primitives";

function CaseLedger() {
  const { data, caseKey, setCaseKey } = useCase();
  return (
    <div className="case-ledger">
      {(["bodeoum_tv", "mimiminu"] as const).map((key, index) => {
        const item = data.cases[key];
        const active = key === caseKey;
        return (
          <button
            type="button"
            key={key}
            className={`case-file case-file--${item.accent} ${active ? "is-active" : ""}`}
            onClick={() => setCaseKey(key)}
            aria-pressed={active}
          >
            <span className="case-file__top">
              <span className="case-file__index">0{index + 1}</span>
              <span className="case-file__state">{active ? "Now viewing" : "Open case"}</span>
            </span>
            <span className="case-file__name">{item.name}</span>
            <span className="case-file__person">
              {item.person} · {item.role}
            </span>
            <span className="case-file__trigger">{item.trigger}</span>
            <span className="case-file__detail">{item.triggerDetail}</span>
            <span className="case-file__outcome">{item.outcome}</span>
            <span className="case-file__meta">
              <span>{fmtInt(item.analyzed)} comments</span>
              <span>
                {fmtDate(item.windows.pre.start)} — {fmtDate(item.windows.post.end)}
              </span>
            </span>
            <span className="case-file__arrow" aria-hidden="true">
              {active ? "●" : "→"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SlotBrowser() {
  const { caseData } = useCase();
  const [selected, setSelected] = useState(10);

  useEffect(() => setSelected(10), [caseData.id]);
  const slot = caseData.slots[selected];
  const apology = slot.window === "cancel";

  return (
    <div className="slot-browser">
      <div className="slot-browser__head">
        <div>
          <span className="eyebrow">The 21-video design</span>
          <h3>One event. Ten videos either side.</h3>
        </div>
        <div className="legend legend--windows">
          <span><i className="swatch swatch--pre" /> before</span>
          <span><i className="swatch swatch--cancel" /> apology</span>
          <span><i className="swatch swatch--post" /> after</span>
        </div>
      </div>

      <div className="slot-browser__groups" aria-hidden="true">
        <span>10 before · P10 → P1</span>
        <span>apology</span>
        <span>10 after · A1 → A10</span>
      </div>

      <div className="slot-strip" role="group" aria-label="Choose a video slot">
        {caseData.slots.map((item, index) => (
          <button
            key={item.slot}
            type="button"
            className={`slot-cell slot-cell--${item.window} ${
              index === selected ? "is-selected" : ""
            }`}
            onClick={() => setSelected(index)}
            aria-pressed={index === selected}
            aria-label={`${slotShort(item.slot)} ${WINDOW_LONG[item.window]} — ${item.title}`}
          >
            <span>{slotShort(item.slot)}</span>
            <small>{fmtCompact(item.n)}</small>
          </button>
        ))}
      </div>

      <div className="slot-detail" aria-live="polite">
        <div className="slot-detail__main">
          <div className="slot-detail__kicker">
            <span className={`slot-key slot-key--${slot.window}`}>{slotShort(slot.slot)}</span>
            <span>{WINDOW_LABEL[slot.window]} window</span>
            <span>{fmtDate(slot.date)}</span>
          </div>
          <h4>{slot.title}</h4>
          {apology && <p className="slot-detail__translation">“{caseData.apologyTitleEn}”</p>}
          <a
            className="text-link"
            href={`https://www.youtube.com/watch?v=${slot.videoId}`}
            target="_blank"
            rel="noreferrer"
          >
            View the video on YouTube <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="slot-detail__stats">
          <div>
            <span>Analyzed comments</span>
            <strong>{fmtInt(slot.n)}</strong>
          </div>
          <div>
            <span>Mean sentiment</span>
            <strong>{slot.sentiment.toFixed(3)}</strong>
          </div>
          <div>
            <span>Positive / negative</span>
            <strong>
              {fmtPct(slot.pos, 1)} <i>/</i> {fmtPct(slot.neg, 1)}
            </strong>
          </div>
          <div>
            <span>Views / likes</span>
            <strong>
              {fmtCompact(slot.views)} <i>/</i> {fmtCompact(slot.likes)}
            </strong>
          </div>
          <div>
            <span>Authors / reply links</span>
            <strong>
              {fmtInt(slot.network.nodes)} <i>/</i> {fmtInt(slot.network.edges)}
            </strong>
          </div>
        </div>
      </div>

      <p className="slot-browser__note">
        Pre videos are numbered backwards from the apology: <b>P1</b> is the closest upload,{" "}
        <b>P10</b> the earliest. Post videos run forward: <b>A1</b> is the first upload after.
        The apology is always slot <b>AP</b>.
      </p>
    </div>
  );
}

export function DesignSection() {
  const { data, caseData } = useCase();
  const bodeoum = data.cases.bodeoum_tv;
  const mimiminu = data.cases.mimiminu;
  return (
    <section className="section section--design" id="design">
      <div className="container">
        <SectionHead
          number="00"
          eyebrow="Study design"
          title={
            <>
              A scandal is an event.
              <br />
              A cancellation is a <em>sequence</em>.
            </>
          }
          lede={
            <>
              The study puts the formal apology at the center and compares the ten videos
              before it with the ten after it. The same 21-slot design is applied to both
              cases, so the unit of analysis is always one video slot.
            </>
          }
        />

        <div className="protocol reveal">
          <div className="protocol__phase protocol__phase--pre">
            <span className="protocol__count">10</span>
            <span className="protocol__label">Before</span>
            <p>Videos published before the controversy reaches the apology.</p>
          </div>
          <div className="protocol__phase protocol__phase--cancel">
            <span className="protocol__count">1</span>
            <span className="protocol__label">Apology</span>
            <p>The formal response video. The hinge of the design.</p>
          </div>
          <div className="protocol__phase protocol__phase--post">
            <span className="protocol__count">10</span>
            <span className="protocol__label">After</span>
            <p>Videos published after the apology, as the channel resumes.</p>
          </div>
          <div className="protocol__spine" aria-hidden="true">
            <span />
          </div>
        </div>

        <div className="section-block reveal">
          <div className="block-head">
            <h3>Two cases, one protocol</h3>
            <p>
              A discrete trigger, a formal apology video, and at least 1,000 comments.
              Select a case to thread it through every section.
            </p>
          </div>
          <CaseLedger />
        </div>

        <div className="section-block reveal">
          <SlotBrowser />
        </div>

        <div className="design-notes reveal">
          <Callout title="Held constant" tone="key">
            <p>
              Ten pre videos, one apology, ten post videos. The same sentiment model and
              network definitions run on both cases. Pre and post are defined relative to
              the apology, not to a calendar month.
            </p>
          </Callout>
          <Callout title="Not held constant" tone="warn">
            <p>
              Calendar time is not equal: Bodeoum&apos;s pre window spans{" "}
              <b>{bodeoum.windows.pre.days} days</b> and its post window{" "}
              <b>{bodeoum.windows.post.days} days</b>; Mimiminu&apos;s span{" "}
              <b>{mimiminu.windows.pre.days}</b> and <b>{mimiminu.windows.post.days}</b>{" "}
              days. Fixed video counts control for upload count, not elapsed time.
            </p>
          </Callout>
        </div>

        <Artifact path={`02-preprocessing/outputs/${caseData.id}/videos.csv`} />
      </div>
    </section>
  );
}
