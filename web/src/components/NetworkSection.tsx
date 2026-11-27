import { useCase } from "../context/CaseContext";
import { fmtDensity, fmtInt } from "../lib/format";
import { SectionHead } from "./SectionHead";
import { ThreadGraph } from "./charts/ThreadGraph";
import { Artifact, Callout, Tag } from "./ui/Primitives";

function Amplification() {
  const { data } = useCase();
  const rows = [
    { key: "edges", label: "Reply edges" },
    { key: "nodes", label: "Authors" },
    { key: "density", label: "Density" },
  ] as const;

  return (
    <div className="amplification">
      <div className="amplification__head">
        <div>
          <span className="eyebrow">Apology window ÷ before window</span>
          <h3>One ratio, two different stories.</h3>
        </div>
        <div className="amplification__legend">
          <span><i className="amp-dot amp-dot--b" /> Bodeoum</span>
          <span><i className="amp-dot amp-dot--m" /> Mimiminu</span>
        </div>
      </div>

      <div className="amplification__axis">
        <span>0.1×</span>
        <span>1×</span>
        <span>10×</span>
      </div>

      <div className="amplification__rows">
        {rows.map((row) => (
          <div className="amp-row" key={row.key}>
            <span className="amp-row__label">{row.label}</span>
            <div className="amp-track" aria-hidden="true">
              <i className="amp-zero" />
              {(["bodeoum_tv", "mimiminu"] as const).map((caseKey) => {
                const ratio = data.cases[caseKey].network.amplification[row.key];
                const position = 50 + (Math.log10(ratio) / 2) * 50;
                const left = Math.min(50, position);
                const width = Math.abs(position - 50);
                return (
                  <span
                    key={caseKey}
                    className={`amp-bar amp-bar--${caseKey === "bodeoum_tv" ? "b" : "m"}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`${data.cases[caseKey].name}: ${ratio.toFixed(2)}×`}
                  />
                );
              })}
            </div>
            <div className="amp-row__values">
              <b>{data.cases.bodeoum_tv.network.amplification[row.key].toFixed(2)}×</b>
              <b>{data.cases.mimiminu.network.amplification[row.key].toFixed(2)}×</b>
            </div>
          </div>
        ))}
      </div>

      <p className="amplification__note">
        A ratio above 1× means the apology window is larger or denser than the before
        window. Density is the exception that tells the clearest structural story: it
        fell in Bodeoum&apos;s much larger graph and rose sharply in Mimiminu&apos;s
        smaller one.
      </p>
    </div>
  );
}

function NetworkTable() {
  const { caseData } = useCase();
  const rows = [
    {
      label: "Authors (nodes)",
      values: (["pre", "cancel", "post"] as const).map(
        (window) => caseData.network.windows[window].nodes,
      ),
      format: fmtInt,
      scale: Math.max(...(["pre", "cancel", "post"] as const).map((w) => caseData.network.windows[w].nodes)),
    },
    {
      label: "Author-to-author edges",
      values: (["pre", "cancel", "post"] as const).map(
        (window) => caseData.network.windows[window].edges,
      ),
      format: fmtInt,
      scale: Math.max(...(["pre", "cancel", "post"] as const).map((w) => caseData.network.windows[w].edges)),
    },
    {
      label: "Density ×10⁻⁴",
      values: (["pre", "cancel", "post"] as const).map(
        (window) => caseData.network.windows[window].density * 10_000,
      ),
      format: (value: number) => value.toFixed(2),
      scale: Math.max(...(["pre", "cancel", "post"] as const).map((w) => caseData.network.windows[w].density * 10_000)),
    },
    {
      label: "Modularity",
      values: (["pre", "cancel", "post"] as const).map(
        (window) => caseData.network.windows[window].modularity,
      ),
      format: (value: number) => value.toFixed(3),
      scale: 1,
    },
    {
      label: "Communities",
      values: (["pre", "cancel", "post"] as const).map(
        (window) => caseData.network.windows[window].communities,
      ),
      format: fmtInt,
      scale: Math.max(...(["pre", "cancel", "post"] as const).map((w) => caseData.network.windows[w].communities)),
    },
    {
      label: "Cascade depth",
      values: (["pre", "cancel", "post"] as const).map(
        (window) => caseData.network.windows[window].cascade,
      ),
      format: (value: number) => String(Math.round(value)),
      scale: Math.max(...(["pre", "cancel", "post"] as const).map((w) => caseData.network.windows[w].cascade)),
    },
  ];

  return (
    <div className="network-table-wrap">
      <div className="network-table__head">
        <div>
          <span className="eyebrow">Window metrics</span>
          <h3>The shape changes, not just the size.</h3>
        </div>
        <span className="network-table__legend">
          <i className="swatch swatch--pre" /> before <i className="swatch swatch--cancel" /> apology{" "}
          <i className="swatch swatch--post" /> after
        </span>
      </div>
      <table className="network-table">
        <thead>
          <tr>
            <th scope="col">Metric</th>
            <th scope="col">Before</th>
            <th scope="col" className="is-highlighted">Apology</th>
            <th scope="col">After</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              {row.values.map((value, index) => (
                <td key={index} className={index === 1 ? "is-highlighted" : undefined}>
                  <span className="network-cell">
                    <span
                      className={`network-cell__bar network-cell__bar--${
                        index === 0 ? "pre" : index === 1 ? "cancel" : "post"
                      }`}
                      style={{ width: `${Math.max(4, (value / row.scale) * 100)}%` }}
                    />
                    <b>{row.format(value)}</b>
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="network-table__note">
        Density is {fmtDensity(caseData.network.windows.cancel.density)} × 10⁻⁴ in the
        apology window. Modularity is Louvain at resolution 1.0, seed 42. Cascade depth is
        the longest reply chain. Graph size tracks comment volume; density and modularity
        describe structure.
      </p>
    </div>
  );
}

export function NetworkSection() {
  const { caseData } = useCase();
  return (
    <section className="section section--network" id="network">
      <div className="container">
        <SectionHead
          number="04"
          eyebrow="Network"
          title={
            <>
              A reply is an <em>edge</em>.
              <br />
              A commenter is a node.
            </>
          }
          lede={
            <>
              The comment tree becomes an author-level directed graph. Each unique user
              is a node; each reply points from the replier to the author of the parent
              comment. Repeated replies between the same two authors become a weighted
              edge. Then the graph is measured.
            </>
          }
        />

        <div className="network-defs reveal">
          <div>
            <span className="network-defs__glyph">●</span>
            <strong>Node</strong>
            <p>A unique author. One person can write many comments and still be one node.</p>
          </div>
          <div>
            <span className="network-defs__glyph">→</span>
            <strong>Edge</strong>
            <p>
              A reply from author A to the author of the parent comment, B. The direction
              is A → B.
            </p>
          </div>
          <div>
            <span className="network-defs__glyph">≡</span>
            <strong>Weight</strong>
            <p>How many times A replied to B. The layout ignores weight for legibility.</p>
          </div>
        </div>

        <div className="section-block reveal">
          <ThreadGraph caseData={caseData} />
        </div>

        <div className="reply-to-edge reveal">
          <span className="eyebrow">What collapses</span>
          <div className="reply-to-edge__numbers">
            <strong>{fmtInt(caseData.windows.cancel.replyLinks)}</strong>
            <span>comment reply links</span>
            <i>→</i>
            <strong>{fmtInt(caseData.network.windows.cancel.edges)}</strong>
            <span>unique author pairs</span>
          </div>
          <p>
            Multiple replies between the same pair become one weighted edge. This is why
            the author graph is smaller than the comment tree—and why one loud thread can
            look large in comments but small in authors.
          </p>
        </div>

        <div className="section-block reveal">
          <NetworkTable />
        </div>

        <div className="section-block reveal">
          <Amplification />
        </div>

        <div className="topology-compare reveal">
          <article className="topology topology--oxide">
            <div className="topology__top">
              <span className="eyebrow">Bodeoum TV</span>
              {caseData.id === "bodeoum_tv" && <Tag tone="oxide">Now viewing</Tag>}
            </div>
            <h3>Expansion → fragmentation</h3>
            <p>
              The apology window multiplied the graph: edges grew to{" "}
              <b>5.97×</b> the before window, while density fell to <b>0.24×</b>. More
              people, more replies, less shared context. The graph then reconsolidated
              after the apology.
            </p>
            <div className="topology__stats">
              <span><b>357 → 969 → 168</b> communities</span>
              <span><b>17 → 24 → 12</b> cascade depth</span>
              <span><b>0.816 → 0.769 → 0.920</b> modularity</span>
            </div>
          </article>
          <article className="topology topology--slate">
            <div className="topology__top">
              <span className="eyebrow">Mimiminu</span>
              {caseData.id === "mimiminu" && <Tag tone="slate">Now viewing</Tag>}
            </div>
            <h3>Contraction → consolidation</h3>
            <p>
              The apology graph was smaller than the before graph: edges fell to{" "}
              <b>0.19×</b>, while density rose to <b>3.61×</b>. The audience that stayed
              was more tightly connected, and modularity rose.
            </p>
            <div className="topology__stats">
              <span><b>202 → 77 → 204</b> communities</span>
              <span><b>20 → 7 → 8</b> cascade depth</span>
              <span><b>0.836 → 0.881 → 0.912</b> modularity</span>
            </div>
          </article>
        </div>

        <div className="network-notes reveal">
          <Callout title="Read the ratios, then the graph" tone="key">
            <p>
              Bodeoum&apos;s apology video drew 94,521 comments; Mimiminu&apos;s drew
              3,013. Raw graph size cannot be compared across cases as if it were
              popularity. The useful comparison is the <i>direction</i> of change within
              each case: expansion and fragmentation versus contraction and consolidation.
            </p>
          </Callout>
          <Callout title="Not a measure of public opinion" tone="warn">
            <p>
              YouTube commenters are not a representative sample. Reply graphs show who
              talks to whom in one comment section, not the views of the wider public.
              The metrics are descriptive, not causal.
            </p>
          </Callout>
        </div>

        <Artifact path={`03-analysis/outputs/${caseData.id}/network_by_window.csv`} />
      </div>
    </section>
  );
}
