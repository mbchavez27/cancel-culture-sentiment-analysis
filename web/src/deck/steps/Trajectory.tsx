import { useEffect, useState } from "react";
import { useCase } from "../../context/CaseContext";
import { fmtDate, fmtDecimal, fmtInt, slotLabel } from "../../lib/format";
import { TrajectoryChart } from "../charts";
import { Callout, StepCopy, Viz } from "../parts";

export function TrajectoryStep() {
  const { caseData, otherCase } = useCase();
  const [selected, setSelected] = useState(10);

  useEffect(() => setSelected(10), [caseData.id]);

  const slot = caseData.slots[selected];
  const recovery = caseData.recovery;

  return (
    <section className="step">
      <StepCopy
        number="05"
        label="Over time"
        title={
          <>
            The apology is not always the <em>bottom.</em>
          </>
        }
        lede="Each point is one video. Bodeoum falls around the apology, then recovers. Mimiminu barely moves."
      >
        <Callout>
          One point per video, not per comment. The apology's{" "}
          {fmtInt(caseData.windows.cancel.n)} comments do not dominate.
        </Callout>
      </StepCopy>

      <Viz
        title="Average mood across the apology"
        meta={`lowest ${slotLabel(recovery.nadirSlot)} · ${fmtDecimal(recovery.nadirValue)}`}
        foot="Tap a point to inspect the video."
      >
        <TrajectoryChart
          caseData={caseData}
          otherCase={otherCase}
          selected={selected}
          onSelect={setSelected}
        />

        <div className="legend legend--trajectory">
          <span>
            <i className="swatch swatch--pre" /> before
          </span>
          <span>
            <i className="swatch swatch--cancel" /> apology
          </span>
          <span>
            <i className="swatch swatch--post" /> after
          </span>
          <span className="legend__note">
            <i className="legend__line" /> {caseData.short}
          </span>
          <span className="legend__note">
            <i className="legend__dash" /> {otherCase.short}
          </span>
        </div>

        <div className="trajectory-detail">
          <div className="trajectory-detail__top">
            <span className={`slot-badge slot-badge--${slot.window}`}>{slotLabel(slot.slot)}</span>
            <span>{fmtDate(slot.date)}</span>
            <span>{fmtInt(slot.n)} comments</span>
            <strong>mean {fmtDecimal(slot.sentiment)}</strong>
          </div>
          <span className="detail-kind">Video title</span>
          <p className="trajectory-detail__title">{slot.title}</p>
          <p className="trajectory-detail__translation">{slot.titleEn}</p>
          <div className="trajectory-detail__stats">
            <span>
              positive <strong>{slot.pos.toFixed(1)}%</strong>
            </span>
            <span>
              negative <strong>{slot.neg.toFixed(1)}%</strong>
            </span>
            <span>
              authors <strong>{fmtInt(slot.network.nodes)}</strong>
            </span>
          </div>
        </div>
      </Viz>
    </section>
  );
}
