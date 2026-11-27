import type { SentimentExample } from "../../types";

interface Props {
  examples: SentimentExample[];
}

const LABEL_COLOR: Record<string, string> = {
  POSITIVE: "var(--post)",
  NEGATIVE: "var(--cancel)",
  NEUTRAL: "var(--gold)",
};

export function ConfidenceBand({ examples }: Props) {
  const width = 640;
  const height = 148;
  const left = 32;
  const right = 24;
  const plotW = width - left - right;
  const x = (score: number) => left + score * plotW;
  const bandStart = x(0.4);
  const bandEnd = x(0.6);

  return (
    <figure className="confidence">
      <div className="confidence__head">
        <span className="eyebrow">The confidence band</span>
        <h4>Where a score becomes a label</h4>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="A zero-to-one confidence axis with a shaded neutral band from 0.4 to 0.6. Positive examples cluster near 0.98; one neutral example sits at about 0.51."
      >
        <rect className="confidence__axis-bg" x={left} y="54" width={plotW} height="22" rx="1" />
        <rect
          className="confidence__band"
          x={bandStart}
          y="44"
          width={bandEnd - bandStart}
          height="42"
        />
        <line className="confidence__axis" x1={left} x2={left + plotW} y1="65" y2="65" />
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((tick) => (
          <g key={tick}>
            <line className="confidence__tick" x1={x(tick)} x2={x(tick)} y1="59" y2="71" />
            <text className="axis-label" x={x(tick)} y="92" textAnchor="middle">
              {tick.toFixed(1)}
            </text>
          </g>
        ))}
        <text className="confidence__band-label" x={(bandStart + bandEnd) / 2} y="33" textAnchor="middle">
          0.4–0.6 → NEUTRAL
        </text>
        {examples.map((example, index) => {
          const offset = [0, -10, 10, -5][index] ?? 0;
          return (
            <g key={`${example.label}-${example.text.slice(0, 8)}`} className="confidence__point">
              <circle
                cx={x(example.score)}
                cy={65 + offset}
                r="6"
                fill={LABEL_COLOR[example.sentiment]}
              />
              <title>
                {example.label}: {example.score.toFixed(3)} ({example.sentiment})
              </title>
            </g>
          );
        })}
        <text className="confidence__side-label" x={left} y="126">
          raw model confidence
        </text>
        <text className="confidence__side-label" x={left + plotW} y="126" textAnchor="end">
          higher certainty →
        </text>
        <text className="confidence__note" x={width / 2} y="126" textAnchor="middle">
          max softmax
        </text>
      </svg>
      <figcaption>
        The model outputs a polarity score. Predictions whose maximum confidence falls
        between 0.4 and 0.6 are relabeled NEUTRAL. This is an uncertainty rule, not a
        claim that “neutral” is a clean third emotion.
      </figcaption>
    </figure>
  );
}
