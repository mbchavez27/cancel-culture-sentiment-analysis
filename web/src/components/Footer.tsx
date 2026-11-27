import { useCase } from "../context/CaseContext";

export function Footer() {
  const { data } = useCase();
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <span className="wordmark__mark" aria-hidden="true" />
          <div>
            <strong>Anatomy of a Cancellation</strong>
            <span>A pipeline walkthrough for {data.meta.venue}</span>
          </div>
        </div>
        <div className="footer__links">
          <a href={data.meta.paper} target="_blank" rel="noreferrer">Paper</a>
          <a href={data.meta.slides} target="_blank" rel="noreferrer">Slides</a>
          <a href={data.meta.repo} target="_blank" rel="noreferrer">Code</a>
          <a href="#top">Back to top ↑</a>
        </div>
        <p className="footer__note">
          Charts are hand-built SVG from the repository&apos;s exported CSVs. No comments
          are loaded at runtime. Sentiment is a model output, not a truth claim.
        </p>
      </div>
    </footer>
  );
}
