import { useEffect, useMemo, useState } from "react";
import dataJson from "./data/cases.json";
import type { CaseKey, SiteData } from "./types";
import { CaseContext } from "./context/CaseContext";
import { Deck } from "./deck/Deck";

const data = dataJson as unknown as SiteData;

function initialCase(): CaseKey {
  if (typeof window === "undefined") return "bodeoum_tv";
  const param = new URLSearchParams(window.location.search).get("case");
  if (param === "mimiminu" || param === "bodeoum_tv") return param;
  return "bodeoum_tv";
}

export default function App() {
  const [caseKey, setCaseKey] = useState<CaseKey>(initialCase);

  useEffect(() => {
    document.documentElement.dataset.case = caseKey;
    const url = new URL(window.location.href);
    if (caseKey === "mimiminu") url.searchParams.set("case", "mimiminu");
    else url.searchParams.delete("case");
    window.history.replaceState({}, "", url);
  }, [caseKey]);

  const value = useMemo(() => {
    const otherKey: CaseKey = caseKey === "bodeoum_tv" ? "mimiminu" : "bodeoum_tv";
    return {
      data,
      caseKey,
      otherKey,
      caseData: data.cases[caseKey],
      otherCase: data.cases[otherKey],
      setCaseKey,
      toggleCase: () => setCaseKey(otherKey),
    };
  }, [caseKey]);

  return (
    <CaseContext.Provider value={value}>
      <Deck />
    </CaseContext.Provider>
  );
}
