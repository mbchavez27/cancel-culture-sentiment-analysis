import { useId, useMemo, useState } from "react";
import type { CaseStudy, WindowKey } from "../../types";
import {
  clamp,
  fmtDateShort,
  fmtInt,
  fmtPct,
  slotShort,
  smoothPath,
} from "../../lib/format";

interface Props {
  caseData: CaseStudy;
  otherCase: CaseStudy;
}

const WIDTH = 1000;
const HEIGHT = 360;
const MARGIN = { top: 42, right: 26, bottom: 58, left: 58 };
const INNER_W = WIDTH - MARGIN.left - MARGIN.right;
const INNER_H = HEIGHT - MARGIN.top - MARGIN.bottom;
const Y_MIN = 0.72;
const Y_MAX = 0.95;
const Y_TICKS = [0.75, 0.8, 0.85, 0.9, 0.95];

export function SlotTrajectory({ caseData, otherCase }: Props) {
  const [selected, setSelected] = useState(10);
  const [hover, setHover] = useState<number | null>(null);
  const gradientId = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const x = (index: number) => MARGIN.left + (index / (caseData.slots.length - 1)) * INNER_W;
  const y = (value: number) =>
    MARGIN.top + (1 - (clamp(value, Y_MIN, Y_MAX) - Y_MIN) / (Y_MAX - Y_MIN)) * INNER_H;

  const points = useMemo(
    () => caseData.slots.map((slot, index) => ({ x: x(index), y: y(slot.sentiment) })),
    [caseData],
  );
  const ghostPoints = useMemo(
    () =>
      otherCase.slots.map((slot, index) => ({
        x: MARGIN.left + (index / (otherCase.slots.length - 1)) * INNER_W,
        y: MARGIN.top + (1 - (clamp(slot.sentiment, Y_MIN, Y_MAX) - Y_MIN) / (Y_MAX - Y_MIN)) * INNER_H,
      })),
    [otherCase],
  );

  const line = smoothPath(points);
  const area = `${line} L ${points[points.length - 1].x} ${MARGIN.top + INNER_H} L ${points[0].x} ${
    MARGIN.top + INNER_H
  } Z`;
  const ghostLine = smoothPath(ghostPoints);
  const step = INNER_W / (caseData.slots.length - 1);
  const half = step / 2;
  const bands: Array<{ window: WindowKey; from: number; to: number; label: string }> = [
    { window: "pre", from: MARGIN.left, to: x(9) + half, label: "BEFORE · 10 VIDEOS" },
    { window: "cancel", from: x(10) - half, to: x(10) + half, label: "APOLOGY" },
    { window: "post", from: x(11) - half, to: MARGIN.left + INNER_W, label: "AFTER · 10 VIDEOS" },
  ];

  const activeIndex = hover ?? selected;
  const active = caseData.slots[activeIndex];
  const activeX = x(activeIndex);
  const activeY = y(active.sentiment);
  const tooltipAlign = activeIndex > 15 ? "left" : activeIndex < 5 ? "right" : "center";

  const nadirIndex = caseData.slots.findIndex((slot) => slot.slot === caseData.recovery.nadirSlot);
  const maxN = Math.max(...caseData.slots.map((slot) => slot.n));
  const minLog = Math.log10(Math.min(...caseData.slots.map((slot) => slot.n)));
  const maxLog = Math.log10(maxN);

  return (
    <figure className="trajectory">
      <div className="trajectory__head">
        <div>
          <span className="eyebrow">21 slots · mean comment sentiment</span>
          <h3>{caseData.name}: the view across the apology</h3>
        </div>
        <div className="trajectory__legend">
          <span className="legend-case legend-case--selected">
            <i /> {caseData.name}
          </span>
          <span className="legend-case legend-case--ghost">
            <i /> {otherCase.name}
          </span>
          <span className="legend-window">
            <i className="swatch swatch--pre" /> before
            <i className="swatch swatch--cancel" /> apology
            <i className="swatch swatch--post" /> after
          </span>
        </div>
      </div>

      <div className="trajectory__canvas">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`Sentiment trajectory for ${caseData.name}. The apology slot is highlighted; the other case is shown as a dashed reference line. Full values are available in the data table below.`}
        >
          <defs>
            <linearGradient id={`${gradientId}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ink)" stopOpacity="0.09" />
              <stop offset="100%" stopColor="var(--ink)" stopOpacity="0" />
            </linearGradient>
            <clipPath id={`${gradientId}-clip`}>
              <rect x={MARGIN.left} y={MARGIN.top} width={INNER_W} height={INNER_H} />
            </clipPath>
          </defs>

          {bands.map((band) => (
            <g key={band.window}>
              <rect
                className={`band band--${band.window}`}
                x={band.from}
                y={MARGIN.top}
                width={band.to - band.from}
                height={INNER_H}
              />
              <text
                className={`band__label band__label--${band.window}`}
                x={(band.from + band.to) / 2}
                y={MARGIN.top - 14}
                textAnchor="middle"
              >
                {band.label}
              </text>
            </g>
          ))}

          {Y_TICKS.map((tick) => (
            <g key={tick}>
              <line
                className="axis-grid"
                x1={MARGIN.left}
                x2={MARGIN.left + INNER_W}
                y1={y(tick)}
                y2={y(tick)}
              />
              <text className="axis-label" x={MARGIN.left - 12} y={y(tick) + 4} textAnchor="end">
                {tick.toFixed(2)}
              </text>
            </g>
          ))}

          <line
            className="axis-line"
            x1={MARGIN.left}
            x2={MARGIN.left + INNER_W}
            y1={MARGIN.top + INNER_H}
            y2={MARGIN.top + INNER_H}
          />
          <line
            className="axis-line"
            x1={MARGIN.left}
            x2={MARGIN.left}
            y1={MARGIN.top}
            y2={MARGIN.top + INNER_H}
          />

          <path className="ghost-line" d={ghostLine} />
          <path className="area-fill" d={area} fill={`url(#${gradientId}-fill)`} />
          <path className="selected-line" d={line} />

          {caseData.slots.map((slot, index) => (
            <circle
              key={slot.slot}
              className={`point point--${slot.window} ${index === selected ? "is-selected" : ""}`}
              cx={x(index)}
              cy={y(slot.sentiment)}
              r={index === selected ? 7 : 4.2}
            />
          ))}

          {nadirIndex >= 0 && (
            <g className="nadir-marker">
              <circle cx={x(nadirIndex)} cy={y(caseData.slots[nadirIndex].sentiment)} r="11" />
              <line
                x1={x(nadirIndex)}
                x2={x(nadirIndex)}
                y1={y(caseData.slots[nadirIndex].sentiment) + 13}
                y2={MARGIN.top + INNER_H}
              />
              <text
                x={x(nadirIndex) + 12}
                y={y(caseData.slots[nadirIndex].sentiment) + 24}
                textAnchor={nadirIndex > 16 ? "end" : "start"}
              >
                nadir · {slotShort(caseData.recovery.nadirSlot)} ·{" "}
                {caseData.recovery.nadirValue.toFixed(3)}
              </text>
            </g>
          )}

          <g className="slot-labels">
            {caseData.slots.map((slot, index) => {
              const minor = ![0, 4, 9, 10, 11, 15, 20].includes(index);
              return (
                <text
                  key={slot.slot}
                  x={x(index)}
                  y={MARGIN.top + INNER_H + 24}
                  textAnchor="middle"
                  className={`slot-label ${minor ? "slot-label--minor" : ""} ${
                    slot.window === "cancel" ? "slot-label--cancel" : ""
                  }`}
                >
                  {slotShort(slot.slot)}
                </text>
              );
            })}
          </g>

          <line
            className="cancel-rule"
            x1={x(10)}
            x2={x(10)}
            y1={MARGIN.top}
            y2={MARGIN.top + INNER_H}
          />

          <g className="hover-capture">
            {caseData.slots.map((slot, index) => (
              <rect
                key={slot.slot}
                x={x(index) - half}
                y={MARGIN.top}
                width={step}
                height={INNER_H}
                onPointerEnter={() => setHover(index)}
                onPointerLeave={() => setHover(null)}
                onClick={() => setSelected(index)}
              />
            ))}
          </g>
        </svg>

        {hover !== null && (
          <div
            className={`chart-tooltip chart-tooltip--${tooltipAlign}`}
            style={{
              left: `${(activeX / WIDTH) * 100}%`,
              top: `${(activeY / HEIGHT) * 100}%`,
            }}
          >
            <div className="chart-tooltip__slot">
              <span className={`slot-key slot-key--${active.window}`}>{slotShort(active.slot)}</span>
              <span>{fmtDateShort(active.date)}</span>
            </div>
            <strong>{active.sentiment.toFixed(3)}</strong>
            <span>{fmtInt(active.n)} comments</span>
          </div>
        )}
      </div>

      <div className="trajectory__volume" aria-label="Comment volume by slot">
        <div className="trajectory__volume-label">
          <span>comments / slot</span>
          <small>log scale</small>
        </div>
        <svg viewBox={`0 0 ${WIDTH} 78`} aria-hidden="true">
          {caseData.slots.map((slot, index) => {
            const h = 10 + ((Math.log10(slot.n) - minLog) / (maxLog - minLog)) * 46;
            return (
              <rect
                key={slot.slot}
                className={`volume-bar volume-bar--${slot.window} ${
                  index === selected ? "is-selected" : ""
                }`}
                x={x(index) - step * 0.3}
                y={64 - h}
                width={step * 0.6}
                height={h}
                onPointerEnter={() => setHover(index)}
                onPointerLeave={() => setHover(null)}
                onClick={() => setSelected(index)}
              />
            );
          })}
          <line className="volume-axis" x1={MARGIN.left} x2={MARGIN.left + INNER_W} y1="64" y2="64" />
        </svg>
      </div>

      <div className="trajectory__detail" aria-live="polite">
        <div className="trajectory__detail-title">
          <span className={`slot-key slot-key--${active.window}`}>{slotShort(active.slot)}</span>
          <div>
            <strong>{active.title}</strong>
            <small>
              {fmtDateShort(active.date)} · {fmtInt(active.n)} comments ·{" "}
              {active.window === "cancel" ? "formal apology" : `${active.window} window`}
            </small>
          </div>
        </div>
        <div className="trajectory__detail-stats">
          <div>
            <span>Mean</span>
            <strong>{active.sentiment.toFixed(3)}</strong>
          </div>
          <div>
            <span>Positive</span>
            <strong>{fmtPct(active.pos, 1)}</strong>
          </div>
          <div>
            <span>Negative</span>
            <strong>{fmtPct(active.neg, 1)}</strong>
          </div>
          <div>
            <span>Authors</span>
            <strong>{fmtInt(active.network.nodes)}</strong>
          </div>
        </div>
      </div>

      <figcaption>
        Mean sentiment is the average model score across comments in a slot, not the
        share of positive comments. The cancel slot is one video; the before and after
        windows contain ten videos each. Y-axis starts at {Y_MIN.toFixed(2)} to make
        slot-level differences visible.
      </figcaption>

      <details className="data-table">
        <summary>View the 21-slot data</summary>
        <div>
          <table>
            <caption>{caseData.name}: sentiment by video slot</caption>
            <thead>
              <tr>
                <th scope="col">Slot</th>
                <th scope="col">Date</th>
                <th scope="col">Comments</th>
                <th scope="col">Mean</th>
                <th scope="col">Positive</th>
                <th scope="col">Negative</th>
              </tr>
            </thead>
            <tbody>
              {caseData.slots.map((slot) => (
                <tr key={slot.slot} className={slot.window === "cancel" ? "is-cancel" : undefined}>
                  <th scope="row">{slotShort(slot.slot)}</th>
                  <td>{slot.date}</td>
                  <td>{fmtInt(slot.n)}</td>
                  <td>{slot.sentiment.toFixed(3)}</td>
                  <td>{fmtPct(slot.pos, 1)}</td>
                  <td>{fmtPct(slot.neg, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
