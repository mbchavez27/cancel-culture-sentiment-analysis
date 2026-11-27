import { useState } from "react";
import { useCase } from "../context/CaseContext";
import { fmtCompact, fmtInt } from "../lib/format";
import { SectionHead } from "./SectionHead";
import { Artifact, Callout } from "./ui/Primitives";

function CodeBlock({ text, language }: { text: string; language: string }) {
  return (
    <div className="code-block">
      <div className="code-block__bar">
        <span>{language}</span>
        <span>trimmed for display</span>
      </div>
      <pre>
        <code>
          {text.split("\n").map((line, index) => (
            <span className="code-line" key={`${index}-${line}`}>
              <i aria-hidden="true">{String(index + 1).padStart(2, "0")}</i>
              <span>{line}</span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

export function CollectSection() {
  const { caseData } = useCase();
  const [tab, setTab] = useState(0);
  const [showEnglish, setShowEnglish] = useState(false);

  const video = caseData.apology;
  const input = [
    "window,video",
    ...caseData.slots
      .slice(0, 2)
      .map((slot) => `pre,https://www.youtube.com/watch?v=${slot.videoId}`),
    `cancel,https://www.youtube.com/watch?v=${video.videoId}`,
    ...caseData.slots
      .filter((slot) => slot.window === "post")
      .slice(0, 2)
      .map((slot) => `post,https://www.youtube.com/watch?v=${slot.videoId}`),
  ].join("\n");

  const videoRecord = JSON.stringify(
    {
      platform: "youtube",
      record_type: "video",
      video_id: video.videoId,
      title: video.title,
      create_time: `${video.date}T00:00:00+00:00`,
      view_count: video.views,
      like_count: video.likes,
      window_label: "cancel",
    },
    null,
    2,
  );

  const commentRecord = JSON.stringify(caseData.rawComment, null, 2);

  const tabs = [
    {
      label: "Input list",
      file: `data/input/${caseData.id}.csv`,
      content: <CodeBlock text={input} language="CSV" />,
      note: (
        <>
          A human-written list of video URLs, labelled by window. One row becomes one
          slot. The order in the list defines the slot number.
        </>
      ),
    },
    {
      label: "Video record",
      file: `data/${caseData.id}/${caseData.id}_youtube.jsonl`,
      content: <CodeBlock text={videoRecord} language="JSON" />,
      note: (
        <>
          The scraper expands each URL into a video record: title, date, views, likes,
          and the window label used downstream.
        </>
      ),
    },
    {
      label: "Comment record",
      file: `data/${caseData.id}/comments/cancel-1.info.json`,
      content: <CodeBlock text={commentRecord} language="JSON" />,
      note: (
        <>
          Every comment keeps its <code>parent</code> pointer. That single field is what
          lets the analysis rebuild a reply tree and, later, an author graph.
        </>
      ),
    },
    {
      label: "Transcript",
      file: `data/${caseData.id}/transcripts/cancel-1.ko.txt`,
      content: (
        <div className="transcript">
          <div className="transcript__bar">
            <span>faster-whisper · Korean</span>
            <button type="button" onClick={() => setShowEnglish((value) => !value)}>
              {showEnglish ? "Show Korean" : "Show English"}
            </button>
          </div>
          <pre className={showEnglish ? "is-english" : undefined}>
            {showEnglish ? caseData.transcript.translation : caseData.transcript.text}
          </pre>
        </div>
      ),
      note: <>{caseData.transcript.note}</>,
    },
  ];

  const active = tabs[tab];

  return (
    <section className="section section--collect" id="collect">
      <div className="container">
        <SectionHead
          number="01"
          eyebrow="Collect"
          title={
            <>
              Start with a list.
              <br />
              Leave with a <em>conversation</em>.
            </>
          }
          lede={
            <>
              Collection is deliberately boring: a CSV of video URLs goes in, a set of
              video and comment records comes out. The interesting part is what the
              scraper preserves—parent IDs, author IDs, timestamps, and likes—because
              those fields become the network later.
            </>
          }
        />

        <div className="collect-flow reveal" aria-label="Collection pipeline">
          {[
            ["01", "URL list", "window + video"],
            ["02", "Video pass", "metadata + counts"],
            ["03", "Comment pass", "comments + replies"],
            ["04", "Audio pass", "local transcript"],
          ].map(([number, label, detail], index) => (
            <div className="flow-step" key={label}>
              <span>{number}</span>
              <strong>{label}</strong>
              <small>{detail}</small>
              {index < 3 && <i aria-hidden="true">→</i>}
            </div>
          ))}
        </div>

        <div className="collect-grid">
          <div className="collect-browser reveal">
            <div className="browser-tabs" role="tablist" aria-label="Collected artifacts">
              {tabs.map((item, index) => (
                <button
                  key={item.label}
                  role="tab"
                  type="button"
                  aria-selected={tab === index}
                  aria-controls="artifact-panel"
                  onClick={() => setTab(index)}
                  className={tab === index ? "is-active" : undefined}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {item.label}
                </button>
              ))}
            </div>
            <div className="browser-panel" id="artifact-panel" role="tabpanel">
              {active.content}
              <p className="browser-panel__note">{active.note}</p>
              <Artifact path={active.file} label="File" />
            </div>
          </div>

          <aside className="collect-aside reveal">
            <div className="collect-stat">
              <span>Raw comments</span>
              <strong>{fmtInt(caseData.raw)}</strong>
              <small>before any filtering, across 21 videos</small>
            </div>
            <div className="collect-stat">
              <span>Reply links in the apology window</span>
              <strong>{fmtInt(caseData.windows.cancel.replyLinks)}</strong>
              <small>comment-to-comment parent links</small>
            </div>
            <div className="collect-stat">
              <span>Apology comments analyzed</span>
              <strong>{fmtCompact(caseData.apology.n)}</strong>
              <small>{((caseData.apology.n / caseData.analyzed) * 100).toFixed(1)}% of this case</small>
            </div>
            <p className="collect-aside__note">
              Only the apology transcript is present for each case in this repository.
              Transcripts provide context; the paper does not analyze the video content
              itself.
            </p>
          </aside>
        </div>

        <div className="collect-notes reveal">
          <Callout title="Preserved, not discarded" tone="key">
            <p>
              Each reply carries the ID of the comment it answers. The scraper also keeps{" "}
              <code>author_id</code>, <code>timestamp</code>, and <code>like_count</code>.
              Remove any one of those fields and the network or the time ordering becomes
              impossible to reconstruct.
            </p>
          </Callout>
          <Callout title="A single scrape" tone="warn">
            <p>
              Comments were collected at one point after both events. The two cases had
              different amounts of time to accumulate replies, and the platform can
              change what it surfaces. The paper compares video-content groups, not
              real-time audience reactions.
            </p>
          </Callout>
        </div>

        <div className="file-tree reveal">
          <span className="eyebrow">On disk</span>
          <code>data/{caseData.id}/{caseData.id}_youtube.jsonl</code>
          <code>data/{caseData.id}/comments/cancel-1.info.json</code>
          <code>data/{caseData.id}/transcripts/cancel-1.ko.txt</code>
        </div>
      </div>
    </section>
  );
}
