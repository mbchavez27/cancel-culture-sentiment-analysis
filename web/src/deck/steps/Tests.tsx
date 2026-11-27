import { useCase } from "../../context/CaseContext";
import { WINDOW_LABEL } from "../../lib/format";
import { Callout, StepCopy, Viz } from "../parts";

const WINDOWS = ["pre", "cancel", "post"] as const;

export function TestsStep() {
  const { data, caseData } = useCase();
  const kruskal = data.evaluation.kruskal[caseData.id];
  const dunn = data.evaluation.dunn[caseData.id];

  const pair = (a: (typeof WINDOWS)[number], b: (typeof WINDOWS)[number]) =>
    dunn.find((item) => (item.a === a && item.b === b) || (item.a === b && item.b === a));

  return (
    <section className="step">
      <StepCopy
        number="08"
        label="Tests"
        title={
          <>
            Check the test <em>first.</em>
          </>
        }
        lede="The scores are not evenly spread, so the study uses a rank test. Dunn's test then checks each pair of windows."
      >
        <Callout>
          {caseData.id === "bodeoum_tv"
            ? "Bodeoum: all three windows differ (p < 0.001)."
            : "Mimiminu: before differs from both later windows; apology and after do not (p = 1.000)."}
        </Callout>

        <p className="unit-check">
          Tests use comments. The next step uses 21 video averages.
        </p>
      </StepCopy>

      <Viz
        title="Which windows differ?"
        meta={`${caseData.short} · adjusted p`}
        foot="Lower p means a clearer difference."
      >
        <div className="kw-stat">
          <span>Kruskal–Wallis</span>
          <strong>H = {kruskal.H.toFixed(2)}</strong>
          <span>df {kruskal.df}</span>
          <span>p {kruskal.p}</span>
        </div>

        <table className="dunn">
          <thead>
            <tr>
              <th aria-label="Window" />
              {WINDOWS.map((window) => (
                <th key={window}>{WINDOW_LABEL[window]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WINDOWS.map((row) => (
              <tr key={row}>
                <th>{WINDOW_LABEL[row]}</th>
                {WINDOWS.map((column) => {
                  if (row === column) {
                    return (
                      <td key={column} className="dunn__cell is-diag">
                        —
                      </td>
                    );
                  }
                  const result = pair(row, column);
                  return (
                    <td
                      key={column}
                      className={`dunn__cell ${result?.sig ? "is-sig" : "is-ns"}`}
                    >
                      {result?.p ?? "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <p className="dunn__note">A difference is not proof of cause.</p>
      </Viz>
    </section>
  );
}
