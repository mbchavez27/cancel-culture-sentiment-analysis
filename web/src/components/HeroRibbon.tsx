import { useEffect, useMemo, useState } from "react";
import type { CaseStudy } from "../types";
import {
  clamp,
  fmtCompact,
  fmtDateShort,
  fmtInt,
  slotShort,
  WINDOW_LABEL,
} from "../lib/format";

interface Props {
  caseData: CaseStudy;
}

export function HeroRibbon({ caseData }: Props) {
  const [selected, setSelected] = useState(10);
  useEffect(() => setSelected(10), [caseData.id]);

  const maxN = Math.max(...caseData.slots.map((slot) => slot.n));
  const points = useMemo(
    () =>
      caseData.slots.map((slot, index) => {
        const x = ((index + 0.5) / caseData.slots.length) * 100;
        const y = 100 - clamp((slot.sentiment - 0.75) / 0.2, 0, 1) * 100;
        return { x, y };
      }),
    [caseData],
  );
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
  const active = caseData.slots[selected];

  return (
    <div className="hero-ribbon">
      <div className="hero-ribbon__topline">
        <div>
          <span className="eyebrow">Specimen ribbon</span>
          <strong>{caseData.name}</strong>
        </div>
        <div className="hero-ribbon__legend">
          <span>
            <i className="legend-bar" /> bar = comments
          </span>
          <span>
            <i className="legend-line" /> line = sentiment
          </span>
        </div>
      </div>

      <div className="hero-ribbon__plot">
        <div className="hero-ribbon__bars" role="group" aria-label={`Comment volume and sentiment for ${caseData.name}`}>
          {caseData.slots.map((slot, index) => {
            const height = Math.sqrt(slot.n / maxN) * 100;
            return (
              <button
                type="button"
                key={slot.slot}
                className={`hero-ribbon__bar hero-ribbon__bar--${slot.window} ${
                  index === selected ? "is-selected" : ""
                }`}
                onMouseEnter={() => setSelected(index)}
                onFocus={() => setSelected(index)}
                onClick={() => setSelected(index)}
                aria-label={`${slotShort(slot.slot)} ${WINDOW_LABEL[slot.window]}, ${fmtInt(
                  slot.n,
                )} analyzed comments, sentiment ${slot.sentiment.toFixed(3)}`}
                aria-pressed={index === selected}
              >
                <span style={{ height: `${height}%` }} />
              </button>
            );
          })}
        </div>
        <svg
          className="hero-ribbon__line"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d={path} vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="hero-ribbon__dots" aria-hidden="true">
          {caseData.slots.map((slot, index) => (
            <span
              key={slot.slot}
              className={`hero-ribbon__dot hero-ribbon__dot--${slot.window} ${
                index === selected ? "is-selected" : ""
              }`}
              style={{ left: `${points[index].x}%`, top: `${points[index].y}%` }}
            />
          ))}
        </div>
      </div>

      <div className="hero-ribbon__windows" aria-hidden="true">
        <span>10 before</span>
        <span>apology</span>
        <span>10 after</span>
      </div>

      <div className="hero-ribbon__readout" aria-live="polite">
        <div className="hero-ribbon__readout-key">
          <span className={`slot-key slot-key--${active.window}`}>{slotShort(active.slot)}</span>
          <span>{fmtDateShort(active.date)}</span>
          <span>{fmtInt(active.n)} comments</span>
        </div>
        <div className="hero-ribbon__readout-main">
          <strong>{active.sentiment.toFixed(3)}</strong>
          <span>mean sentiment</span>
        </div>
        <p>{active.title}</p>
      </div>

      <p className="hero-ribbon__note">
        Each bar is one video. Height is comment volume on a square-root scale; the line is
        the video&apos;s mean comment sentiment. The apology video holds{" "}
        <b>{((caseData.apology.n / caseData.analyzed) * 100).toFixed(1)}%</b> of this
        case&apos;s analyzed comments ({fmtCompact(caseData.apology.n)}).
      </p>
    </div>
  );
}
