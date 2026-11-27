import { useEffect, useMemo, useState } from "react";
import type { CaseStudy, ThreadNode } from "../../types";
import { fmtInt, SENTIMENT_LABEL } from "../../lib/format";
import { Tag } from "../ui/Primitives";

interface Props {
  caseData: CaseStudy;
}

interface PositionedNode extends ThreadNode {
  x: number;
  y: number;
  radius: number;
  shortHandle: string;
  inDegree: number;
  parentAuthor: string | null;
}

const WIDTH = 760;
const HEIGHT = 390;

function shortHandle(handle: string): string {
  if (handle.length <= 14) return handle;
  return `${handle.slice(0, 12)}…`;
}

function layout(caseData: CaseStudy): PositionedNode[] {
  const { nodes, edges } = caseData.network.thread;
  const root = nodes.find((node) => node.depth === 0);
  if (!root) return [];
  const children = new Map<string, ThreadNode[]>();
  nodes.forEach((node) => {
    if (node.depth === 0) return;
    const parent = node.parentId;
    children.set(parent, [...(children.get(parent) ?? []), node]);
  });

  const xForDepth = (depth: number) => 104 + depth * 216;
  const positions = new Map<string, { x: number; y: number }>();
  const leafYs: number[] = [];
  const leafCount = nodes.filter((node) => !children.has(node.id)).length;
  const top = 74;
  const bottom = HEIGHT - 72;
  const gap = leafCount > 1 ? (bottom - top) / (leafCount - 1) : 0;

  const place = (node: ThreadNode): number => {
    const kids = children.get(node.id) ?? [];
    let y: number;
    if (kids.length === 0) {
      y = top + leafYs.length * gap;
      leafYs.push(y);
    } else {
      const childYs = kids.map((child) => place(child));
      y = childYs.reduce((sum, value) => sum + value, 0) / childYs.length;
    }
    positions.set(node.id, { x: xForDepth(node.depth), y });
    return y;
  };
  place(root);

  return nodes.map((node) => {
    const pos = positions.get(node.id) ?? { x: xForDepth(node.depth), y: HEIGHT / 2 };
    const parent = edges.find((edge) => edge.source === node.id);
    const parentNode = parent ? nodes.find((item) => item.id === parent.target) : undefined;
    return {
      ...node,
      x: pos.x,
      y: pos.y,
      radius: Math.min(25, 14 + Math.sqrt(node.likes + 1) / 4),
      shortHandle: shortHandle(node.handle),
      inDegree: edges.filter((edge) => edge.target === node.id).length,
      parentAuthor: parentNode?.author ?? null,
    };
  });
}

export function ThreadGraph({ caseData }: Props) {
  const [selectedId, setSelectedId] = useState(caseData.network.thread.rootId);
  useEffect(() => setSelectedId(caseData.network.thread.rootId), [caseData.id]);
  const positioned = useMemo(() => layout(caseData), [caseData]);
  const selected = positioned.find((node) => node.id === selectedId) ?? positioned[0];
  const edges = caseData.network.thread.edges;
  const activeEdgeIds = new Set(
    edges
      .filter((edge) => edge.source === selectedId || edge.target === selectedId)
      .map((edge) => `${edge.source}-${edge.target}`),
  );

  return (
    <div className="thread-graph">
      <div className="thread-graph__head">
        <div>
          <span className="eyebrow">A real thread / not a toy example</span>
          <h3>Five comments. Five authors. One little graph.</h3>
        </div>
        <div className="thread-graph__counts">
          <span><b>{caseData.network.thread.nodeCount}</b> comments</span>
          <span><b>{caseData.network.thread.authorCount}</b> authors</span>
          <span><b>{caseData.network.thread.maxDepth + 1}</b> levels</span>
        </div>
      </div>

      <div className="thread-graph__grid">
        <div className="thread-conversation" aria-label="Comment thread">
          {positioned
            .slice()
            .sort((a, b) => a.depth - b.depth || a.y - b.y)
            .map((node) => (
              <button
                type="button"
                key={node.id}
                className={`thread-comment ${node.id === selectedId ? "is-selected" : ""}`}
                style={{ marginLeft: `${Math.min(node.depth, 2) * 18}px` }}
                onClick={() => setSelectedId(node.id)}
              >
                <span className={`thread-comment__dot thread-comment__dot--${node.sentiment.toLowerCase()}`} />
                <span className="thread-comment__body">
                  <span className="thread-comment__meta">
                    <b>{node.handle}</b>
                    {node.depth > 0 && <span>↳ reply</span>}
                    <span>{fmtInt(node.likes)} likes</span>
                  </span>
                  <span className="thread-comment__text">{node.text}</span>
                </span>
              </button>
            ))}
        </div>

        <div className="thread-canvas">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="img"
            aria-label={`Author-level reply graph for the selected ${caseData.name} thread. Nodes are unique authors; arrows point from the replier to the author of the parent comment.`}
          >
            <defs>
              <marker id="thread-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" className="thread-arrow-head" />
              </marker>
            </defs>

            {edges.map((edge) => {
              const source = positioned.find((node) => node.id === edge.source);
              const target = positioned.find((node) => node.id === edge.target);
              if (!source || !target) return null;
              const curve = Math.max(24, Math.abs(source.x - target.x) * 0.34);
              const d = `M ${source.x} ${source.y} C ${source.x - curve} ${source.y}, ${
                target.x + curve
              } ${target.y}, ${target.x} ${target.y}`;
              return (
                <path
                  key={`${edge.source}-${edge.target}`}
                  d={d}
                  className={`thread-edge ${
                    activeEdgeIds.has(`${edge.source}-${edge.target}`) ? "is-active" : ""
                  }`}
                  markerEnd="url(#thread-arrow)"
                />
              );
            })}

            {positioned.map((node) => (
              <g
                key={node.id}
                className={`thread-node ${node.id === selectedId ? "is-selected" : ""}`}
                onClick={() => setSelectedId(node.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedId(node.id);
                  }
                }}
                aria-label={`${node.handle}, ${SENTIMENT_LABEL[node.sentiment]}, ${fmtInt(node.likes)} likes`}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius}
                  className={`thread-node__circle thread-node__circle--${node.sentiment.toLowerCase()}`}
                />
                <text className="thread-node__handle" x={node.x} y={node.y + node.radius + 17} textAnchor="middle">
                  {node.shortHandle}
                </text>
                <text className="thread-node__degree" x={node.x} y={node.y + 4} textAnchor="middle">
                  {node.inDegree > 0 ? `↓${node.inDegree}` : ""}
                </text>
                <title>
                  {node.handle} · {node.text} · {SENTIMENT_LABEL[node.sentiment]}
                </title>
              </g>
            ))}

            <text className="thread-graph__axis" x={16} y={HEIGHT - 14}>
              reply → parent author
            </text>
          </svg>
          <div className="thread-legend">
            <span><i className="thread-dot thread-dot--positive" /> positive</span>
            <span><i className="thread-dot thread-dot--negative" /> negative</span>
            <span><i className="thread-dot thread-dot--neutral" /> neutral</span>
            <span>node size = likes</span>
          </div>
        </div>
      </div>

      <div className="thread-detail" aria-live="polite">
        <div className="thread-detail__top">
          <Tag tone={selected.sentiment.toLowerCase()}>{SENTIMENT_LABEL[selected.sentiment]}</Tag>
          <strong>{selected.author}</strong>
          <span>{selected.score.toFixed(3)} confidence</span>
          <span>{fmtInt(selected.likes)} likes</span>
          {selected.inDegree > 0 && <span>in-degree {selected.inDegree}</span>}
        </div>
        <div className="thread-detail__body">
          <p className="thread-detail__text">{selected.text}</p>
          <p className="thread-detail__translation">{selected.translation}</p>
        </div>
        {selected.parentAuthor && (
          <p className="thread-detail__parent">
            Replying to <b>{selected.parentAuthor}</b>
          </p>
        )}
      </div>

      <p className="thread-graph__note">
        {caseData.network.thread.note} The full cancel-window graph is much larger:{" "}
        <b>{fmtInt(caseData.network.windows.cancel.nodes)}</b> authors and{" "}
        <b>{fmtInt(caseData.network.windows.cancel.edges)}</b> author-to-author edges.
      </p>
    </div>
  );
}
