import { useCase } from "../context/CaseContext";
import { fmtCompact, fmtInt } from "../lib/format";
import { AnimatedNumber } from "./AnimatedNumber";
import { HeroRibbon } from "./HeroRibbon";

export function Hero() {
  const { data, caseData } = useCase();
  const { meta } = data;

  return (
    <section className="hero" id="top">
      <div className="container hero__inner">
        <div className="hero__kicker">
          <span className="eyebrow">{meta.venue} · Research explained</span>
          <span className="hero__kicker-line" aria-hidden="true" />
          <span className="eyebrow">2 cases · 42 videos · 145,280 comments</span>
        </div>

        <h1 className="hero__title">
          Anatomy
          <br />
          of a <em>cancellation</em>
          <span className="hero__period">.</span>
        </h1>

        <div className="hero__grid">
          <div className="hero__deck-wrap">
            <p className="hero__deck">
              Two Korean YouTubers. Two apology videos. One comment section at a time.
              A step-by-step walk through the collection, cleaning, sentiment, network,
              and evaluation pipeline behind a study of cancel culture.
            </p>
            <div className="hero__actions">
              <a className="button button--ink" href="#design">
                Walk the pipeline <span aria-hidden="true">↓</span>
              </a>
              <a className="button button--line" href={meta.paper} target="_blank" rel="noreferrer">
                Read the paper <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>

          <div className="hero__case">
            <div className="hero__case-label">
              <span className="case-dot case-dot--oxide" />
              Case file / current view
            </div>
            <h2>{caseData.name}</h2>
            <p className="hero__case-person">
              {caseData.person} <span>·</span> {caseData.role}
            </p>
            <div className="hero__case-stats">
              <div>
                <span>Analyzed</span>
                <strong>
                  <AnimatedNumber
                    key={caseData.id}
                    value={caseData.analyzed}
                    format={(value) => fmtInt(Math.round(value))}
                  />
                </strong>
                <small>comments</small>
              </div>
              <div>
                <span>Apology</span>
                <strong>{fmtCompact(caseData.apology.n)}</strong>
                <small>on one video</small>
              </div>
              <div>
                <span>Authors</span>
                <strong>{fmtCompact(caseData.network.windows.cancel.nodes)}</strong>
                <small>in the cancel graph</small>
              </div>
            </div>
            <p className="hero__case-note">
              {caseData.opening}. The formal apology is the hinge; the ten videos on either
              side are the comparison.
            </p>
          </div>
        </div>
      </div>

      <div className="container hero__ribbon-wrap">
        <HeroRibbon caseData={caseData} />
      </div>

      <div className="container hero__foot">
        <div>
          <span className="eyebrow">Based on the paper</span>
          <p>
            {meta.authors.join(", ")}. <i>{meta.title}: {meta.subtitle}</i>.{" "}
            {meta.venue}, {meta.affiliation}.
          </p>
        </div>
        <div className="hero__total">
          <span>All comments analyzed</span>
          <strong>
            <AnimatedNumber
              value={meta.analyzed}
              format={(value) => fmtInt(Math.round(value))}
            />
          </strong>
        </div>
      </div>
    </section>
  );
}
