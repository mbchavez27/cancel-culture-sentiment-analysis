import { useId, useMemo, useState } from "react";
import type { CaseKey, CaseStudy, PearsonMetric } from "../../types";
import {
  clamp,
  fmtDateShort,
  fmtInt,
  fmtP,
  fmtR,
  linearScale,
  niceTicks,
  slotShort,
} from "../../lib/format";

interface Props {
  caseData: CaseStudy;
  otherCase: CaseStudy;
  caseKey: CaseKey;
  metric: PearsonMetric;
}

const WIDTH = 820;
const HEIGHT = 430;
const MARGIN = { top: 26, right: 28, bottom: 70, left: 66 };
const INNER_W = WIDTH - MARGIN.left - MARGIN.right;
const INNER_H = HEIGHT - MARGIN.top - MARGIN.bottom;
const Y_MIN = 0.72;
const Y_MAX = 0.95;

const NETWORK_FIELD: Record<string, keyof CaseStudy["slots"][number]["network"]> = {
  in_degree_mean: "inDegreeMean",
  cascade_depth: "cascade",
  density: "density",
  nodes: "nodes",
  edges: "edges",
  num_communities: "communities",
  degree_variance: "degreeVariance",
  hub_dominance: "hubDominance",
  modularity: "modularity",
  degree_gini: "degreeGini",
};

function metricValue(slot: CaseStudy["slots"][number], key: string): number {
  return slot.network[NETWORK_FIELD[key]];
}

function formatX(value: number, key: string): string {
  if (key === "density") return (value * 10_000).toFixed(2);
  if (key === "modularity" || key === "degree_gini") return value.toFixed(2);
  if (key === "in_degree_mean") return value.toFixed(2);
  if (key === "hub_dominance" || key === "cascade_depth") return value.toFixed(0);
  if (key === "degree_variance") return value.toFixed(0);
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toFixed(1);
}

export function PearsonScatter({ caseData, otherCase, caseKey, metric }: Props) {
  const [hover, setHover] = useState<{ caseKey: CaseKey; slot: string } | null>(null);
  const gradientId = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const selectedPoints = caseData.slots.map((slot) => ({
    x: metricValue(slot, metric.key),
    y: slot.sentiment,
    slot,
  }));
  const otherPoints = otherCase.slots.map((slot) => ({
    x: metricValue(slot, metric.key),
    y: slot.sentiment,
    slot,
  }));

  const allX = [...selectedPoints, ...otherPoints].map((point) => point.x);
  const xMinRaw = Math.min(...allX);
  const xMaxRaw = Math.max(...allX);
  const xPad = (xMaxRaw - xMinRaw || 1) * 0.07;
  const xMin = xMinRaw - xPad;
  const xMax = xMaxRaw + xPad;

  const x = (value: number) => linearScale(value, xMin, xMax, MARGIN.left, MARGIN.left + INNER_W);
  const y = (value: number) =>
    linearScale(clamp(value, Y_MIN, Y_MAX), Y_MIN, Y_MAX, MARGIN.top + INNER_H, MARGIN.top);

  const xTicks = useMemo(() => niceTicks(xMin, xMax, 6), [xMin, xMax]);
  const yTicks = [0.75, 0.8, 0.85, 0.9, 0.95];

  const regression = useMemo(() => {
    const n = selectedPoints.length;
    const meanX = selectedPoints.reduce((sum, point) => sum + point.x, 0) / n;
    const meanY = selectedPoints.reduce((sum, point) => sum + point.y, 0) / n;
    const covariance = selectedPoints.reduce(
      (sum, point) => sum + (point.x - meanX) * (point.y - meanY),
      0,
    );
    const variance = selectedPoints.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0);
    const slope = variance === 0 ? 0 : covariance / variance;
    return { slope, intercept: meanY - slope * meanX };
  }, [selectedPoints]);

  const regStart = { x: xMin, y: regression.intercept + regression.slope * xMin };
  const regEnd = { x: xMax, y: regression.intercept + regression.slope * xMax };
  const stats = metric[caseKey];
  const otherStats = metric[caseKey === "bodeoum_tv" ? "mimiminu" : "bodeoum_tv"];
  const activePoint = hover
    ? (hover.caseKey === caseKey ? selectedPoints : otherPoints).find(
        (point) => point.slot.slot === hover.slot,
      )
    : undefined;

  return (
    <figure className="scatter">
      <div className="scatter__head">
        <div>
          <span className="eyebrow">21 slots · one dot per video</span>
          <h3>{metric.label} vs. mean sentiment</h3>
        </div>
        <div className="scatter__stats">
          <div>
            <span>{caseData.name}</span>
            <strong>{fmtR(stats.r)}</strong>
            <small>
              {stats.sig ? "significant" : "not significant"} · p {fmtP(stats.p)}
            </small>
          </div>
          <div className="scatter__stats-other">
            <span>{otherCase.name}</span>
            <strong>{fmtR(otherStats.r)}</strong>
            <small>reference · p {fmtP(otherStats.p)}</small>
          </div>
        </div>
      </div>

      <div className="scatter__canvas">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`Scatter plot of ${metric.label} against mean sentiment across 21 slots for ${caseData.name}. Pearson r is ${stats.r.toFixed(3)}.`}
        >
          <defs>
            <linearGradient id={`${gradientId}-bg`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ink)" stopOpacity="0.03" />
              <stop offset="100%" stopColor="var(--ink)" stopOpacity="0" />
            </linearGradient>
          </defs>

          <rect
            x={MARGIN.left}
            y={MARGIN.top}
            width={INNER_W}
            height={INNER_H}
            fill={`url(#${gradientId}-bg)`}
          />

          {yTicks.map((tick) => (
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

          {xTicks.map((tick) => (
            <g key={tick}>
              <line
                className="axis-grid axis-grid--vertical"
                x1={x(tick)}
                x2={x(tick)}
                y1={MARGIN.top}
                y2={MARGIN.top + INNER_H}
              />
              <text
                className="axis-label"
                x={x(tick)}
                y={MARGIN.top + INNER_H + 22}
                textAnchor="middle"
              >
                {formatX(tick, metric.key)}
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

          <line
            className="regression-line"
            x1={x(regStart.x)}
            y1={y(regStart.y)}
            x2={x(regEnd.x)}
            y2={y(regEnd.y)}
          />

          {otherPoints.map((point) => (
            <circle
              key={`other-${point.slot.slot}`}
              className="scatter-point scatter-point--ghost"
              cx={x(point.x)}
              cy={y(point.y)}
              r="3.2"
              onPointerEnter={() => setHover({ caseKey: caseKey === "bodeoum_tv" ? "mimiminu" : "bodeoum_tv", slot: point.slot.slot })}
              onPointerLeave={() => setHover(null)}
            >
              <title>
                {otherCase.name} · {slotShort(point.slot.slot)} · {formatX(point.x, metric.key)} ·{" "}
                {point.y.toFixed(3)}
              </title>
            </circle>
          ))}

          {selectedPoints.map((point) => (
            <circle
              key={point.slot.slot}
              className={`scatter-point scatter-point--${point.slot.window} ${
                hover !== null && hover.caseKey === caseKey && hover.slot === point.slot.slot
                  ? "is-hovered"
                  : ""
              }`}
              cx={x(point.x)}
              cy={y(point.y)}
              r={point.slot.slot === "cancel-1" ? 6.5 : 5}
              onPointerEnter={() => setHover({ caseKey, slot: point.slot.slot })}
              onPointerLeave={() => setHover(null)}
            >
              <title>
                {caseData.name} · {slotShort(point.slot.slot)} · {formatX(point.x, metric.key)} ·{" "}
                {point.y.toFixed(3)}
              </title>
            </circle>
          ))}

          <text
            className="axis-title"
            x={MARGIN.left + INNER_W / 2}
            y={HEIGHT - 16}
            textAnchor="middle"
          >
            {metric.label}
            {metric.key === "density" ? " ×10⁻⁴" : ""}
          </text>
          <text
            className="axis-title"
            transform={`rotate(-90)`}
            x={-(MARGIN.top + INNER_H / 2)}
            y="18"
            textAnchor="middle"
          >
            mean sentiment
          </text>
        </svg>

        {hover && activePoint && (
          <div
            className="scatter-tooltip"
            style={{
              left: `${(x(activePoint.x) / WIDTH) * 100}%`,
              top: `${(y(activePoint.y) / HEIGHT) * 100}%`,
            }}
          >
            <span>{slotShort(activePoint.slot.slot)}</span>
            <b>{formatX(activePoint.x, metric.key)}</b>
            <span>{activePoint.y.toFixed(3)} sentiment</span>
            <small>{fmtDateShort(activePoint.slot.date)}</small>
          </div>
        )}
      </div>

      <div className="scatter__legend">
        <span><i className="swatch swatch--pre" /> before</span>
        <span><i className="swatch swatch--cancel" /> apology</span>
        <span><i className="swatch swatch--post" /> after</span>
        <span><i className="scatter-ghost-key" /> other case</span>
        <span><i className="scatter-regression-key" /> fitted line</span>
      </div>

      <figcaption>
        Each dot is one of the 21 video slots. The filled dots are {caseData.name};
        hollow dots are {otherCase.name}. The line is a least-squares fit for the selected
        case. Correlation is not causation, and the apology slot is a single, very large
        video.
      </figcaption>

      <details className="data-table">
        <summary>View the 21 slot pairs</summary>
        <div>
          <table>
            <caption>{caseData.name}: {metric.label} and sentiment by slot</caption>
            <thead>
              <tr>
                <th scope="col">Slot</th>
                <th scope="col">Date</th>
                <th scope="col">{metric.label}</th>
                <th scope="col">Mean sentiment</th>
                <th scope="col">Comments</th>
              </tr>
            </thead>
            <tbody>
              {selectedPoints.map((point) => (
                <tr key={point.slot.slot}>
                  <th scope="row">{slotShort(point.slot.slot)}</th>
                  <td>{point.slot.date}</td>
                  <td>{formatX(point.x, metric.key)}</td>
                  <td>{point.y.toFixed(3)}</td>
                  <td>{fmtInt(point.slot.n)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
