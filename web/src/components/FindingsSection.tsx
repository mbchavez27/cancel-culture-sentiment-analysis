import { useState } from "react";
import { useCase } from "../context/CaseContext";
import { fmtInt, fmtR, fmtSignedPct } from "../lib/format";
import { SectionHead } from "./SectionHead";

const TAKEAWAYS = [
  {
    number: "01",
    title: "The apology is not automatically the bottom.",
    body: "Bodeoum's slot-level sentiment falls 5.25% at the apology, then rises 5.00% above its pre level. Mimiminu's is already 3.09% above pre at the apology and 3.99% above pre after. Both cases recover; they do not recover in the same shape.",
  },
  {
    number: "02",
    title: "A bigger conversation is not a more connected one.",
    body: "Bodeoum's apology graph grows to 5.97× the before-edges, but density falls to 0.24×. Mimiminu's apology graph is 0.19× the size, but density rises to 3.61×. Expansion and fragmentation are not the same thing as engagement.",
  },
  {
    number: "03",
    title: "Concentration tracks negativity.",
    body: "Across the 21 slots, mean in-degree correlates negatively with sentiment in both cases: −0.747 for Bodeoum and −0.732 for Mimiminu. When replies pile onto fewer authors, the video's average sentiment tends to be lower. This is a correlation, not a causal lever.",
  },
  {
    number: "04",
    title: "Repair is visible, but not isolable.",
    body: "Mimiminu returned his advertising fee and added money to a victim fund; his post window stays above pre. Bodeoum was cleared of criminal intent later; his channel rebounds after a pause. The design can describe the timing, but it cannot separate restitution from audience loyalty, time, or the next video's topic.",
  },
];

export function FindingsSection() {
  const { data, caseData } = useCase();
  const [copied, setCopied] = useState(false);
  const citation = `${data.meta.authors.join(", ")} (2026). ${data.meta.title}: ${data.meta.subtitle}. ${data.meta.venue}, ${data.meta.affiliation}.`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="section section--findings" id="findings">
      <div className="container">
        <SectionHead
          number="06"
          eyebrow="Findings"
          title={
            <>
              The apology is a hinge,
              <br />
              not a <em>verdict</em>.
            </>
          }
          lede={
            <>
              Two cases cannot settle a theory of cancel culture. They can show what the
              pipeline makes visible: the shape of a recovery, the structure of a
              conversation, and the difference between a big reaction and a connected one.
            </>
          }
        />

        <div className="findings-list">
          {TAKEAWAYS.map((item) => (
            <article className="finding reveal" key={item.number}>
              <span className="finding__number">{item.number}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="finding-highlight reveal">
          <div>
            <span className="eyebrow">The trajectory in one line</span>
            <p>
              <b>{caseData.name}</b>: apology {fmtSignedPct(caseData.recovery.pctCancelVsPre, 2)},
              after {fmtSignedPct(caseData.recovery.pctPostVsPre, 2)} versus before.{" "}
              <span>
                Nadir {caseData.recovery.nadirValue.toFixed(3)} at{" "}
                {caseData.recovery.nadirSlot}; recovery at {caseData.recovery.recoverySlot}.
              </span>
            </p>
          </div>
          <div className="finding-highlight__numbers">
            <div>
              <strong>{fmtR(data.evaluation.pearson[0][caseData.id].r)}</strong>
              <span>in-degree vs sentiment</span>
            </div>
            <div>
              <strong>{caseData.network.amplification.edges.toFixed(2)}×</strong>
              <span>edge amplification</span>
            </div>
            <div>
              <strong>{fmtInt(caseData.analyzed)}</strong>
              <span>comments analyzed</span>
            </div>
          </div>
        </div>

        <div className="limits reveal">
          <div className="limits__head">
            <span className="eyebrow">What this cannot show</span>
            <h3>The boundaries are part of the result.</h3>
          </div>
          <div className="limits__grid">
            <div>
              <span>01</span>
              <h4>Two cases</h4>
              <p>Two Korean creators, two scandals, two apology videos. Not a sample of cancel culture.</p>
            </div>
            <div>
              <span>02</span>
              <h4>One scrape</h4>
              <p>Comments were collected at a single point. The cases had different amounts of time to accumulate replies.</p>
            </div>
            <div>
              <span>03</span>
              <h4>Commenters are not the public</h4>
              <p>YouTube comment sections overrepresent the people who choose to write, not the audience as a whole.</p>
            </div>
            <div>
              <span>04</span>
              <h4>The model is a measurement</h4>
              <p>Polarity scores miss sarcasm, quoted speech, and the target of criticism. The neutral band is an uncertainty rule.</p>
            </div>
            <div>
              <span>05</span>
              <h4>Video content is context only</h4>
              <p>Transcripts were collected but not analyzed. The study cannot say which words in the apology changed the response.</p>
            </div>
            <div>
              <span>06</span>
              <h4>Fixed slots, unequal time</h4>
              <p>Ten videos before and after controls upload count, not the calendar days between the event and the response.</p>
            </div>
          </div>
        </div>

        <div className="citation reveal">
          <div>
            <span className="eyebrow">Cite this work</span>
            <p>{citation}</p>
            <div className="citation__actions">
              <button type="button" className="button button--line" onClick={copy}>
                {copied ? "Copied" : "Copy citation"}
              </button>
              <a className="button button--line" href={data.meta.paper} target="_blank" rel="noreferrer">
                Paper PDF <span aria-hidden="true">↗</span>
              </a>
              <a className="button button--line" href={data.meta.slides} target="_blank" rel="noreferrer">
                Slides <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
          <div className="citation__meta">
            <span>{data.meta.venue}</span>
            <span>{data.meta.affiliation}</span>
            <span>{data.meta.scrape} scrape</span>
          </div>
        </div>

        <div className="closing reveal">
          <p>
            Collect the conversation. Clean the unit. Score the sentiment. Build the graph.
            Test the difference. Then say only what the data can carry.
          </p>
          <a className="text-link" href={data.meta.repo} target="_blank" rel="noreferrer">
            Re-run the pipeline on GitHub <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
