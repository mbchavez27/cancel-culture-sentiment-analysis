import { useCase } from "../../context/CaseContext";
import { fmtDensity, fmtInt } from "../../lib/format";
import { StepCopy, Viz } from "../parts";

const WINDOWS = ["pre", "cancel", "post"] as const;

export function MetricsStep() {
  const { caseData } = useCase();
  const windows = caseData.network.windows;
  const amp = caseData.network.amplification;
  const topology =
    caseData.id === "bodeoum_tv"
      ? {
          title: "Expansion + fragmentation",
          text: "More authors and far more reply edges, but the graph becomes much sparser and splits into more communities.",
        }
      : {
          title: "Contraction + consolidation",
          text: "Fewer authors and fewer edges, but the remaining conversation is denser and its communities are more modular.",
        };

  const rows = [
    { label: "Authors", value: (w: typeof windows.pre) => fmtInt(w.nodes) },
    { label: "Reply edges", value: (w: typeof windows.pre) => fmtInt(w.edges) },
    { label: "Density ×10⁻⁴", value: (w: typeof windows.pre) => fmtDensity(w.density) },
    { label: "Modularity", value: (w: typeof windows.pre) => w.modularity.toFixed(3) },
    { label: "Communities", value: (w: typeof windows.pre) => fmtInt(w.communities) },
    { label: "Cascade depth", value: (w: typeof windows.pre) => String(w.cascade) },
  ];

  const amplification = [
    { label: "Edges", value: amp.edges, note: "reply volume" },
    { label: "Authors", value: amp.nodes, note: "people replying" },
    { label: "Density", value: amp.density, note: "connectedness" },
    { label: "Gini", value: amp.gini, note: "concentration" },
  ];

  return (
    <section className="step">
      <StepCopy
        number="07"
        label="Shape"
        title={
          <>
            Size is not <em>shape.</em>
          </>
        }
        lede="Bodeoum's apology expands and fragments. Mimiminu's shrinks but gets denser."
      />

      <Viz
        title="Window by window"
        meta={`${caseData.name} · apology vs. before`}
        foot="Raw counts follow turnout. Density and modularity describe the shape."
      >
        <p className="topology-note">
          <strong>{topology.title}</strong> {topology.text}
        </p>

        <table className="metric-table">
          <thead>
            <tr>
              <th>Metric</th>
              {WINDOWS.map((window) => (
                <th key={window} className={window === "cancel" ? "is-apology" : ""}>
                  {window === "pre" ? "Before" : window === "cancel" ? "Apology" : "After"}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th>{row.label}</th>
                {WINDOWS.map((window) => (
                  <td key={window} className={window === "cancel" ? "is-apology" : ""}>
                    {row.value(windows[window])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="amp-cards" aria-label="Apology-to-before amplification">
          {amplification.map((item) => (
            <div key={item.label} className="amp-card">
              <span>{item.label}</span>
              <strong>{item.value.toFixed(2)}×</strong>
              <small>{item.note}</small>
            </div>
          ))}
        </div>
      </Viz>
    </section>
  );
}
