import { createContext, useContext } from "react";
import type { CaseKey, CaseStudy, SiteData } from "../types";

export interface CaseContextValue {
  data: SiteData;
  caseKey: CaseKey;
  otherKey: CaseKey;
  caseData: CaseStudy;
  otherCase: CaseStudy;
  setCaseKey: (key: CaseKey) => void;
  toggleCase: () => void;
}

export const CaseContext = createContext<CaseContextValue | null>(null);

export function useCase(): CaseContextValue {
  const value = useContext(CaseContext);
  if (!value) throw new Error("useCase must be used inside CaseContext");
  return value;
}
