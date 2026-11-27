import { useEffect, useState } from "react";
import { useCase } from "../../context/CaseContext";
import { fmtP, fmtR } from "../../lib/format";
import { CorrelationScatter } from "../charts";
import { StepCopy, Viz } from "../parts";

const METRICS = ["in_degree_mean", "cascade_depth", "density", "modularity"] as const;

const INSIGHT: Record<string, string> = {
  in_degree_mean:
    "Both cases point the same way: slots where reply attention concentrates on fewer authors tend to have lower mean sentiment.",
  cascade_depth:
    "Longer reply chains also travel with lower sentiment, but the association is weaker than mean in-degree.",
  density:
    "The cases diverge. Bodeoum's association is not significant; Mimiminu's denser slots have higher sentiment.",
  modularity:
    "Community separation has no significant relationship with sentiment in either case. This is a useful non-finding.",
};

export function CorrelationStep() {
  const { data, caseData, otherCase } = useCase();
  const [metricKey, setMetricKey] = useState<string>("in_degree_mean");

  useEffect(() => setMetricKey("in_degree_mean"), [caseData.id]);

  const metric =
    data.evaluation.pearson.find((item) => item.key === metricKey) ??
    data.evaluation.pearson[0];
  const stats = metric[caseData.id];
  const otherStats = metric[otherCase.id];

  return (
    <section className="step step--correlation">
      <StepCopy
        number="09"
        label="Link"
        title={
          <>
            Do shape and mood move <em>together?</em>
          </>
        }
        lede="Each dot is one video. In both cases, more concentrated replies go with lower mood."
      />

      <Viz
        title={`${metric.label} vs. mood`}
        meta={`${caseData.name} · 21 videos`}
        foot="Filled: selected case. Hollow: other case. Association, not causation."
      >
        <div className="metric-pills" role="group" aria-label="Choose a network metric">
          {METRICS.map((key) => {
            const item = data.evaluation.pearson.find((metricItem) => metricItem.key === key);
            if (!item) return null;
            const itemStats = item[caseData.id];
            return (
              <button
                key={key}
                type="button"
                className={`metric-pill ${metricKey === key ? "is-active" : ""} ${
                  itemStats.sig ? "is-sig" : ""
                }`}
                onClick={() => setMetricKey(key)}
                aria-pressed={metricKey === key}
              >
                <span>{item.label}</span>
                <b>{fmtR(itemStats.r)}</b>
                <i>{itemStats.sig ? "sig" : "ns"}</i>
              </button>
            );
          })}
        </div>

        <CorrelationScatter
          caseData={caseData}
          otherCase={otherCase}
          metricKey={metricKey}
          metricLabel={metric.label}
        />

        <div className="corr-stats">
          <div>
            <span>{caseData.short}</span>
            <strong>{fmtR(stats.r)}</strong>
            <small>
              r · p {fmtP(stats.p)} · {stats.sig ? "significant" : "not significant"}
            </small>
          </div>
          <div className="corr-stats__other">
            <span>{otherCase.short}</span>
            <strong>{fmtR(otherStats.r)}</strong>
            <small>reference · p {fmtP(otherStats.p)}</small>
          </div>
        </div>

        <p className="example-note">{INSIGHT[metricKey] ?? metric.description}</p>
      </Viz>
    </section>
  );
}
