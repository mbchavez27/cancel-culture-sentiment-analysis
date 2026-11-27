import { useEffect, useState } from "react";
import { useCase } from "../../context/CaseContext";
import { fmtInt, slotShort } from "../../lib/format";
import { ThreadDiagram } from "../charts";
import { StepCopy, Viz } from "../parts";

export function NetworkStep() {
  const { caseData } = useCase();
  const thread = caseData.network.thread;
  const [selectedId, setSelectedId] = useState(thread.rootId);

  useEffect(() => setSelectedId(caseData.network.thread.rootId), [caseData.id]);

  const node = thread.nodes.find((item) => item.id === selectedId) ?? thread.nodes[0];
  const inDegree = thread.edges.filter((edge) => edge.target === node.id).length;

  return (
    <section className="step">
      <StepCopy
        number="06"
        label="Replies"
        title={
          <>
            Replies become a <em>graph.</em>
          </>
        }
        lede="Each author is a node. Each arrow points to the person they replied to."
      />

      <Viz
        title="One real conversation"
        meta={`${thread.authorCount} authors · ${thread.edges.length} replies`}
        foot="Tap a node to read the comment. Colour is its mood label."
      >
        <ThreadDiagram thread={thread} selectedId={selectedId} onSelect={setSelectedId} />

        <div className="thread-detail">
          <div className="thread-detail__top">
            <span className="thread-detail__label">
              {slotShort(node.slot)} · depth {node.depth}
            </span>
            <strong>@{node.handle}</strong>
            <span className={`sentiment-chip sentiment-chip--${node.sentiment.toLowerCase()}`}>
              {node.sentiment}
            </span>
            <span>{fmtInt(node.likes)} likes</span>
            <span>in-degree {inDegree}</span>
          </div>
          <p className="thread-detail__text">{node.text}</p>
          <p className="thread-detail__translation">“{node.translation}”</p>
        </div>
      </Viz>
    </section>
  );
}
