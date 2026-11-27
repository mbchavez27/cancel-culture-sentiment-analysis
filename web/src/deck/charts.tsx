import { useId } from "react";
import type { CaseStudy, Slot, Thread } from "../types";
import {
  clamp,
  fmtMetric,
  linearScale,
  niceTicks,
  slotLabel,
  slotShort,
  smoothPath,
} from "../lib/format";

const WINDOW_COLOR = {
  pre: "#5e7c8d",
  cancel: "#b3452e",
  post: "#5d7654",
} as const;

function lineColor(caseData: CaseStudy) {
  return caseData.id === "bodeoum_tv" ? "#8d3220" : "#4d6877";
}

/* ------------------------------------------------------------------ */
/* Sentiment trajectory                                               */
/* ------------------------------------------------------------------ */

const T_WIDTH = 620;
const T_HEIGHT = 320;
const T_M = { top: 38, right: 18, bottom: 48, left: 56 };
const T_INNER_W = T_WIDTH - T_M.left - T_M.right;
const T_INNER_H = T_HEIGHT - T_M.top - T_M.bottom;
const T_Y_MIN = 0.73;
const T_Y_MAX = 0.94;

export function TrajectoryChart({
  caseData,
  otherCase,
  selected,
  onSelect,
}: {
  caseData: CaseStudy;
  otherCase: CaseStudy;
  selected: number;
  onSelect: (index: number) => void;
}) {
  const slots = caseData.slots;
  const xFor = (index: number) => T_M.left + (index / (slots.length - 1)) * T_INNER_W;
  const yFor = (value: number) =>
    linearScale(clamp(value, T_Y_MIN, T_Y_MAX), T_Y_MIN, T_Y_MAX, T_M.top + T_INNER_H, T_M.top);
  const step = T_INNER_W / (slots.length - 1);
  const nadirIndex = slots.findIndex((slot) => slot.slot === caseData.recovery.nadirSlot);
  const line = smoothPath(slots.map((slot, index) => ({ x: xFor(index), y: yFor(slot.sentiment) })));
  const ghost = smoothPath(
    otherCase.slots.map((slot, index) => ({ x: xFor(index), y: yFor(slot.sentiment) })),
  );
  const ticks = [0.75, 0.8, 0.85, 0.9];
  const xLabels = [0, 5, 10, 15, 20];

  return (
    <svg
      className="chart-svg"
      viewBox={`0 0 ${T_WIDTH} ${T_HEIGHT}`}
      role="img"
      aria-label={`Sentiment trajectory for ${caseData.name}, 21 video slots. Use the points to inspect a slot.`}
    >
      <rect
        x={xFor(0) - step / 2}
        y={T_M.top}
        width={step * 10}
        height={T_INNER_H}
        fill={WINDOW_COLOR.pre}
        opacity="0.055"
      />
      <rect
        x={xFor(10) - step / 2}
        y={T_M.top}
        width={step}
        height={T_INNER_H}
        fill={WINDOW_COLOR.cancel}
        opacity="0.12"
      />
      <rect
        x={xFor(11) - step / 2}
        y={T_M.top}
        width={step * 10}
        height={T_INNER_H}
        fill={WINDOW_COLOR.post}
        opacity="0.055"
      />

      <text x={xFor(4.5)} y={14} textAnchor="middle" className="chart-label">
        BEFORE
      </text>
      <text x={xFor(10)} y={14} textAnchor="middle" className="chart-label chart-label--accent">
        APOLOGY
      </text>
      <text x={xFor(15.5)} y={14} textAnchor="middle" className="chart-label">
        AFTER
      </text>

      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={T_M.left}
            x2={T_WIDTH - T_M.right}
            y1={yFor(tick)}
            y2={yFor(tick)}
            className="chart-grid"
          />
          <text x={T_M.left - 8} y={yFor(tick) + 3} textAnchor="end" className="chart-tick">
            {tick.toFixed(2)}
          </text>
        </g>
      ))}

      <line
        x1={xFor(10)}
        x2={xFor(10)}
        y1={T_M.top}
        y2={T_M.top + T_INNER_H}
        className="chart-rule"
      />

      <path d={ghost} className="trajectory-ghost" />
      <path
        d={line}
        className="trajectory-line"
        pathLength={1}
        fill="none"
        stroke={lineColor(caseData)}
        strokeWidth="2.6"
        strokeLinecap="round"
      />

      {slots.map((slot, index) => (
        <g
          key={slot.slot}
          role="button"
          tabIndex={0}
          aria-label={`${slotLabel(slot.slot)}: ${slot.sentiment.toFixed(3)} mean sentiment, ${slot.n.toLocaleString()} comments`}
          onClick={() => onSelect(index)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelect(index);
            }
          }}
          className="trajectory-point"
        >
          <circle
            cx={xFor(index)}
            cy={yFor(slot.sentiment)}
            r={index === selected ? 6 : 3.4}
            fill={WINDOW_COLOR[slot.window]}
            stroke={index === selected ? "#f8f4eb" : "transparent"}
            strokeWidth={index === selected ? 2 : 0}
          />
          <circle cx={xFor(index)} cy={yFor(slot.sentiment)} r="18" fill="transparent" />
          <title>
            {slotLabel(slot.slot)} · {slot.sentiment.toFixed(3)} · {slot.n.toLocaleString()} comments
          </title>
        </g>
      ))}

      {nadirIndex >= 0 ? (
        <g>
          <circle
            cx={xFor(nadirIndex)}
            cy={yFor(slots[nadirIndex].sentiment)}
            r="7.5"
            fill="none"
            stroke="#b28a45"
            strokeWidth="1.6"
          />
          <title>
            Lowest: {slotLabel(slots[nadirIndex].slot)} ·{" "}
            {slots[nadirIndex].sentiment.toFixed(3)}
          </title>
        </g>
      ) : null}

      {xLabels.map((index) => (
        <text key={index} x={xFor(index)} y={T_HEIGHT - 10} textAnchor="middle" className="chart-tick">
          {slotShort(slots[index].slot)}
        </text>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Reply graph                                                        */
/* ------------------------------------------------------------------ */

const G_WIDTH = 620;
const G_HEIGHT = 460;

export function ThreadDiagram({
  thread,
  selectedId,
  onSelect,
}: {
  thread: Thread;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const markerId = `arrow-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const depthCount = Math.max(1, thread.maxDepth);
  const byDepth = new Map<number, typeof thread.nodes>();
  thread.nodes.forEach((node) => {
    const bucket = byDepth.get(node.depth) ?? [];
    bucket.push(node);
    byDepth.set(node.depth, bucket);
  });

  const positions = new Map<string, { x: number; y: number }>();
  for (let depth = 0; depth <= depthCount; depth += 1) {
    const nodes = byDepth.get(depth) ?? [];
    const x = 76 + (depth / depthCount) * (G_WIDTH - 152);
    nodes.forEach((node, index) => {
      const y = 58 + ((index + 1) / (nodes.length + 1)) * (G_HEIGHT - 116);
      positions.set(node.id, { x, y });
    });
  }

  const inDegree = new Map<string, number>();
  thread.edges.forEach((edge) => {
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  });

  return (
    <svg
      className="chart-svg chart-svg--thread"
      viewBox={`0 0 ${G_WIDTH} ${G_HEIGHT}`}
      role="img"
      aria-label={`Reply graph with ${thread.nodeCount} comments and ${thread.edges.length} reply links.`}
    >
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#958c7d" />
        </marker>
      </defs>

      {thread.edges.map((edge) => {
        const source = positions.get(edge.source);
        const target = positions.get(edge.target);
        if (!source || !target) return null;
        return (
          <path
            key={`${edge.source}-${edge.target}`}
            className="thread-edge"
            pathLength={1}
            d={`M ${source.x} ${source.y} Q ${(source.x + target.x) / 2} ${(source.y + target.y) / 2 - 34} ${target.x} ${target.y}`}
            fill="none"
            stroke="#958c7d"
            strokeWidth="1.4"
            markerEnd={`url(#${markerId})`}
            opacity="0.75"
          />
        );
      })}

      {thread.nodes.map((node, index) => {
        const position = positions.get(node.id);
        if (!position) return null;
        const selected = node.id === selectedId;
        const color =
          node.sentiment === "POSITIVE"
            ? "#5d7654"
            : node.sentiment === "NEGATIVE"
              ? "#b3452e"
              : "#b28a45";
        return (
          <g
            key={node.id}
            role="button"
            tabIndex={0}
            aria-label={`${node.handle}: ${node.text}`}
            onClick={() => onSelect(node.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(node.id);
              }
            }}
            className="thread-node"
          >
            <circle
              cx={position.x}
              cy={position.y}
              r={selected ? 25 : 21}
              fill={color}
              opacity={selected ? 1 : 0.82}
              stroke={selected ? "#171512" : "transparent"}
              strokeWidth="2"
            />
            <text x={position.x} y={position.y + 4} textAnchor="middle" className="thread-node__index">
              {index + 1}
            </text>
            <text x={position.x} y={position.y + 42} textAnchor="middle" className="thread-node__handle">
              {node.handle.length > 12 ? `${node.handle.slice(0, 11)}…` : node.handle}
            </text>
            <title>
              {node.handle} · in-degree {inDegree.get(node.id) ?? 0} · {node.sentiment}
            </title>
          </g>
        );
      })}

      <text x="76" y={G_HEIGHT - 10} textAnchor="middle" className="chart-label thread-caption">
        starts thread
      </text>
      <text x={76 + (G_WIDTH - 152) / 2} y={G_HEIGHT - 10} textAnchor="middle" className="chart-label thread-caption">
        reply
      </text>
      {depthCount > 1 ? (
        <text x={G_WIDTH - 76} y={G_HEIGHT - 10} textAnchor="middle" className="chart-label thread-caption">
          reply again
        </text>
      ) : null}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Correlation scatter                                                */
/* ------------------------------------------------------------------ */

const NETWORK_FIELD: Record<string, keyof Slot["network"]> = {
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

function metricValue(slot: Slot, key: string): number {
  return slot.network[NETWORK_FIELD[key]];
}

const S_WIDTH = 620;
const S_HEIGHT = 310;
const S_M = { top: 30, right: 22, bottom: 62, left: 58 };
const S_INNER_W = S_WIDTH - S_M.left - S_M.right;
const S_INNER_H = S_HEIGHT - S_M.top - S_M.bottom;
const S_Y_MIN = 0.73;
const S_Y_MAX = 0.94;

export function CorrelationScatter({
  caseData,
  otherCase,
  metricKey,
  metricLabel,
  onPoint,
}: {
  caseData: CaseStudy;
  otherCase: CaseStudy;
  metricKey: string;
  metricLabel: string;
  onPoint?: (slot: Slot) => void;
}) {
  const selected = caseData.slots.map((slot) => ({ slot, x: metricValue(slot, metricKey), y: slot.sentiment }));
  const ghost = otherCase.slots.map((slot) => ({ slot, x: metricValue(slot, metricKey), y: slot.sentiment }));
  const allX = [...selected, ...ghost].map((point) => point.x);
  const rawMin = Math.min(...allX);
  const rawMax = Math.max(...allX);
  const pad = (rawMax - rawMin || Math.max(Math.abs(rawMax), 1) * 0.1) * 0.08;
  const xMin = rawMin - pad;
  const xMax = rawMax + pad;
  const xFor = (value: number) => linearScale(value, xMin, xMax, S_M.left, S_M.left + S_INNER_W);
  const yFor = (value: number) =>
    linearScale(clamp(value, S_Y_MIN, S_Y_MAX), S_Y_MIN, S_Y_MAX, S_M.top + S_INNER_H, S_M.top);
  const xTicks = niceTicks(xMin, xMax, 4).filter((tick) => tick >= xMin && tick <= xMax);
  const yTicks = [0.75, 0.8, 0.85, 0.9];

  const meanX = selected.reduce((sum, point) => sum + point.x, 0) / selected.length;
  const meanY = selected.reduce((sum, point) => sum + point.y, 0) / selected.length;
  const covariance = selected.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0);
  const variance = selected.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0);
  const slope = variance === 0 ? 0 : covariance / variance;
  const intercept = meanY - slope * meanX;

  return (
    <svg
      className="chart-svg"
      viewBox={`0 0 ${S_WIDTH} ${S_HEIGHT}`}
      role="img"
      aria-label={`${metricLabel} versus mean sentiment for ${caseData.name}. One dot per video slot.`}
    >
      {yTicks.map((tick) => (
        <g key={tick}>
          <line x1={S_M.left} x2={S_WIDTH - S_M.right} y1={yFor(tick)} y2={yFor(tick)} className="chart-grid" />
          <text x={S_M.left - 8} y={yFor(tick) + 3} textAnchor="end" className="chart-tick">
            {tick.toFixed(2)}
          </text>
        </g>
      ))}

      {xTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={xFor(tick)}
            x2={xFor(tick)}
            y1={S_M.top}
            y2={S_M.top + S_INNER_H}
            className="chart-grid chart-grid--vertical"
          />
          <text x={xFor(tick)} y={S_HEIGHT - 28} textAnchor="middle" className="chart-tick">
            {fmtMetric(tick, metricKey)}
          </text>
        </g>
      ))}

      <line
        x1={S_M.left}
        x2={S_M.left + S_INNER_W}
        y1={S_M.top + S_INNER_H}
        y2={S_M.top + S_INNER_H}
        className="chart-axis"
      />
      <line x1={S_M.left} x2={S_M.left} y1={S_M.top} y2={S_M.top + S_INNER_H} className="chart-axis" />
      <text x={S_M.left + S_INNER_W / 2} y={S_HEIGHT - 8} textAnchor="middle" className="chart-label">
        {metricLabel}
      </text>

      <path
        d={`M ${xFor(xMin)} ${yFor(clamp(intercept + slope * xMin, S_Y_MIN, S_Y_MAX))} L ${xFor(xMax)} ${yFor(clamp(intercept + slope * xMax, S_Y_MIN, S_Y_MAX))}`}
        className="scatter-fit"
        pathLength={1}
      />

      {ghost.map((point) => (
        <circle
          key={`ghost-${point.slot.slot}`}
          cx={xFor(point.x)}
          cy={yFor(point.y)}
          r="3"
          className="scatter-ghost"
        />
      ))}

      {selected.map((point) => (
        <circle
          key={point.slot.slot}
          cx={xFor(point.x)}
          cy={yFor(point.y)}
          r="5"
          fill={WINDOW_COLOR[point.slot.window]}
          stroke="#f8f4eb"
          strokeWidth="1.2"
          onClick={() => onPoint?.(point.slot)}
          className={onPoint ? "scatter-point scatter-point--interactive" : "scatter-point"}
        >
          <title>
            {slotLabel(point.slot.slot)} · {metricLabel} {fmtMetric(point.x, metricKey)} · sentiment{" "}
            {point.y.toFixed(3)}
          </title>
        </circle>
      ))}
    </svg>
  );
}
