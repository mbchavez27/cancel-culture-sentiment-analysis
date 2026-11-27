import { useEffect, useState } from "react";
import { useCase } from "../../context/CaseContext";
import { fmtCompact } from "../../lib/format";
import { StepCopy, Viz } from "../parts";

type Tab = "csv" | "comment" | "transcript";

export function CollectStep() {
  const { data, caseData } = useCase();
  const [tab, setTab] = useState<Tab>("csv");

  useEffect(() => setTab("csv"), [caseData.id]);

  const raw = caseData.rawComment;
  const replyLinks =
    caseData.replyLinks.pre + caseData.replyLinks.cancel + caseData.replyLinks.post;
  const csv = [
    "window,video",
    `pre,https://www.youtube.com/watch?v=${caseData.slots[0].videoId}`,
    `cancel,https://www.youtube.com/watch?v=${caseData.apology.videoId}`,
    `post,https://www.youtube.com/watch?v=${caseData.slots[11].videoId}`,
  ].join("\n");

  const comment = [
    "{",
    `  "id": "${raw.id}",`,
    `  "parent": "${raw.parent || "root"}",`,
    `  "author": "${raw.author}",`,
    `  "author_id": "${raw.author_id}",`,
    `  "text": "${raw.text.replace(/\s+/g, " ").slice(0, 72)}…",`,
    `  "like_count": ${raw.like_count}`,
    "}",
  ].join("\n");

  return (
    <section className="step">
      <StepCopy
        number="02"
        label="Collect"
        title={
          <>
            Collect the <em>comments.</em>
          </>
        }
        lede="A simple list names the videos. The scraper saves each comment and the reply links between them."
      />

      <Viz
        title="What the scraper stores"
        meta={`${fmtCompact(caseData.raw)} comments · ${data.meta.scrape}`}
        foot="One scrape. The windows are video groups, not a live timeline."
      >
        <div className="segmented" role="tablist" aria-label="Collection artifacts">
          {(
            [
              ["csv", "Input CSV"],
              ["comment", "Comment record"],
              ["transcript", "Transcript"],
            ] as Array<[Tab, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className={`segment ${tab === key ? "is-active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "csv" ? (
          <pre className="code-block">{csv}</pre>
        ) : tab === "comment" ? (
          <pre className="code-block code-block--tall">{comment}</pre>
        ) : (
          <div className="transcript-card">
            <p className="transcript-card__meta">Whisper · {caseData.transcriptNote}</p>
            <p className="transcript-card__ko">
              {caseData.transcript.text.replace(/\s+/g, " ").slice(0, 260)}…
            </p>
            <p className="transcript-card__en">{caseData.transcript.translation}</p>
          </div>
        )}

        <div className="mini-stats">
          <span>
            <strong>{fmtCompact(caseData.raw)}</strong> collected
          </span>
          <span>
            <strong>{caseData.slots.length}</strong> video slots
          </span>
          <span>
            <strong>{fmtCompact(replyLinks)}</strong> reply links
          </span>
        </div>
      </Viz>
    </section>
  );
}
