import { useState } from "react";
import { useCase } from "../context/CaseContext";
import {
  fmtP,
  fmtR,
  WINDOW_LABEL,
  WINDOW_ORDER,
} from "../lib/format";
import type { CaseKey, WindowKey } from "../types";
import { SectionHead } from "./SectionHead";
import { PearsonScatter } from "./charts/PearsonScatter";
import { Artifact, Callout, Tag } from "./ui/Primitives";

function TestFlow() {
  const { data, caseData } = useCase();
  const shapiro = data.evaluation.shapiro[caseData.id];
  const kruskal = data.evaluation.kruskal[caseData.id];
  return (
    <div className="test-flow">
      <div className="test-step reveal">
        <span className="test-step__number">01</span>
        <div className="test-step__body">
          <span className="eyebrow">Can we use a normal test?</span>
          <h3>Shapiro–Wilk</h3>
          <p>
            A 5,000-comment random sample is checked window by window. The paper reports
            non-normal distributions for both cases (p &lt; 0.001), ruling out the usual
            ANOVA.
          </p>
          <div className="test-result">
            <strong>{shapiro.p}</strong>
            <Tag tone="oxide">{shapiro.normal ? "normal" : "non-normal"}</Tag>
          </div>
        </div>
      </div>
      <div className="test-step reveal">
        <span className="test-step__number">02</span>
        <div className="test-step__body">
          <span className="eyebrow">Is there a difference anywhere?</span>
          <h3>Kruskal–Wallis</h3>
          <p>
            A rank-based test across the three windows, using all analyzed comments. The
            null is equal sentiment distributions.
          </p>
          <div className="test-result">
            <strong>H = {kruskal.H.toFixed(2)}</strong>
            <span>df = {kruskal.df}</span>
            <Tag tone="oxide">p {kruskal.p}</Tag>
          </div>
        </div>
      </div>
      <div className="test-step reveal">
        <span className="test-step__number">03</span>
        <div className="test-step__body">
          <span className="eyebrow">Which pairs differ?</span>
          <h3>Dunn + Bonferroni</h3>
          <p>
            Pairwise post-hoc comparisons with a multiple-comparison correction. This is
            where the two cases start to diverge.
          </p>
          <div className="test-result">
            <strong>{caseData.id === "bodeoum_tv" ? "3 / 3" : "2 / 3"}</strong>
            <span>pairs significant</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DunnMatrix({ caseKey, title }: { caseKey: CaseKey; title: string }) {
  const { data } = useCase();
  const pairs = data.evaluation.dunn[caseKey];
  const get = (a: WindowKey, b: WindowKey) =>
    a === b ? null : pairs.find((pair) => (pair.a === a && pair.b === b) || (pair.a === b && pair.b === a));

  return (
    <div className="dunn">
      <div className="dunn__head">
        <span className="eyebrow">{title}</span>
        <span className="dunn__legend">
          <i className="dunn-key dunn-key--sig" /> significant
          <i className="dunn-key dunn-key--ns" /> not significant
        </span>
      </div>
      <table>
        <thead>
          <tr>
            <th scope="col" />
            {WINDOW_ORDER.map((window) => (
              <th scope="col" key={window}>{WINDOW_LABEL[window]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {WINDOW_ORDER.map((row) => (
            <tr key={row}>
              <th scope="row">{WINDOW_LABEL[row]}</th>
              {WINDOW_ORDER.map((column) => {
                const pair = get(row, column);
                return (
                  <td
                    key={column}
                    className={
                      pair
                        ? pair.sig
                          ? "is-sig"
                          : "is-ns"
                        : "is-diagonal"
                    }
                  >
                    {pair ? pair.p : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        {caseKey === "bodeoum_tv"
          ? "Every window pair differs at p < 0.001: before vs. apology, before vs. after, and apology vs. after."
          : "Before differs from both apology and after at p < 0.001. Apology vs. after is p = 1.000—the recovery is not a further shift in the tested distribution."}
      </p>
    </div>
  );
}

export function EvaluationSection() {
  const { data, caseData, otherCase } = useCase();
  const [metricKey, setMetricKey] = useState("in_degree_mean");
  const metric =
    data.evaluation.pearson.find((item) => item.key === metricKey) ??
    data.evaluation.pearson[0];
  const stats = metric[caseData.id];
  const pLabel = stats.p < 0.001 ? "< 0.001" : fmtP(stats.p);

  return (
    <section className="section section--evaluate" id="evaluate">
      <div className="container">
        <SectionHead
          number="05"
          eyebrow="Evaluate"
          title={
            <>
              First check the distribution.
              <br />
              Then test the <em>difference</em>.
            </>
          }
          lede={
            <>
              The pipeline does not jump from a pretty chart to a claim. It checks whether
              the data can support a standard test, uses a nonparametric alternative when
              it cannot, and only then asks whether network structure and sentiment move
              together.
            </>
          }
        />

        <TestFlow />

        <div className="test-unit reveal">
          <span>Unit check</span>
          <p>
            The tests above use <b>comment-level</b> sentiment. The correlation below uses
            the <b>21 slot-level means</b>—one dot per video. Mixing those units would
            inflate significance.
          </p>
        </div>

        <div className="section-block reveal">
          <div className="dunn-grid">
            <DunnMatrix caseKey="bodeoum_tv" title="Bodeoum TV · Dunn pairwise p-values" />
            <DunnMatrix caseKey="mimiminu" title="Mimiminu · Dunn pairwise p-values" />
          </div>
          <p className="dunn-note">{data.evaluation.dunn.note}</p>
        </div>

        <div className="section-block reveal">
          <div className="pearson-head">
            <div>
              <span className="eyebrow">RQ2 · network structure vs. sentiment</span>
              <h3>Does the shape of the conversation travel with its mood?</h3>
              <p>
                Pearson correlations across the 21 video slots. Choose a network metric;
                the selected case is filled, the other case is a ghost reference.
              </p>
            </div>
            <div className="pearson-score">
              <span>{caseData.name}</span>
              <strong>{fmtR(stats.r)}</strong>
              <small>
                r · p {pLabel} · {stats.sig ? "significant" : "not significant"}
              </small>
            </div>
          </div>

          <div className="metric-pills" role="group" aria-label="Choose a network metric">
            {data.evaluation.pearson.map((item) => {
              const itemStats = item[caseData.id];
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`metric-pill ${item.key === metric.key ? "is-active" : ""} ${
                    itemStats.sig ? "is-sig" : ""
                  }`}
                  onClick={() => setMetricKey(item.key)}
                  aria-pressed={item.key === metric.key}
                >
                  <span>{item.label}</span>
                  <b>{fmtR(itemStats.r)}</b>
                  <i>{itemStats.sig ? "sig" : "ns"}</i>
                </button>
              );
            })}
          </div>

          <p className="metric-description">{metric.description}</p>

          <PearsonScatter
            caseData={caseData}
            otherCase={otherCase}
            caseKey={caseData.id}
            metric={metric}
          />
        </div>

        <div className="pearson-notes reveal">
          <Callout title="The consistent signal" tone="key">
            <p>
              Mean in-degree correlates negatively with sentiment in both cases:{" "}
              <b>{fmtR(data.evaluation.pearson[0].bodeoum_tv.r)}</b> for Bodeoum and{" "}
              <b>{fmtR(data.evaluation.pearson[0].mimiminu.r)}</b> for Mimiminu. When
              replies concentrate on fewer authors, the slot tends to have lower mean
              sentiment. That is a correlation across videos, not proof that concentration
              causes negativity.
            </p>
          </Callout>
          <Callout title="The inconsistent signals" tone="warn">
            <p>
              Density is strongly positive for Mimiminu but not significant for Bodeoum;
              modularity is not significant in either case. Cascade depth is negative in
              both. Ten metrics were explored, so individual p-values are best read as
              exploratory rather than confirmatory.
            </p>
          </Callout>
        </div>

        <Artifact path="04-evaluation/outputs/pearson_correlation_comparison.csv" />
      </div>
    </section>
  );
}
