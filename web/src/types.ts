export type CaseKey = "bodeoum_tv" | "mimiminu";
export type WindowKey = "pre" | "cancel" | "post";
export type SentimentLabel = "POSITIVE" | "NEGATIVE" | "NEUTRAL";

export interface SlotNetwork {
  nodes: number;
  edges: number;
  density: number;
  modularity: number;
  communities: number;
  cascade: number;
  inDegreeMean: number;
  degreeGini: number;
  hubDominance: number;
  degreeVariance: number;
  components: number;
}

export interface Slot {
  slot: string;
  window: WindowKey;
  number: number;
  videoId: string;
  title: string;
  titleEn: string;
  date: string;
  views: number;
  likes: number;
  sentiment: number;
  n: number;
  pos: number;
  neg: number;
  neu: number;
  network: SlotNetwork;
}

export interface WindowSummary {
  mean: number;
  n: number;
  pos: number;
  neg: number;
  neu: number;
  slotMean: number;
  start: string;
  end: string;
  days: number;
  videos: number;
  replyLinks: number;
}

export interface ThreadNode {
  id: string;
  parentId: string;
  author: string;
  handle: string;
  text: string;
  textClean: string;
  translation: string;
  sentiment: SentimentLabel;
  score: number;
  likes: number;
  depth: number;
  slot: string;
}

export interface ThreadEdge {
  source: string;
  target: string;
  sourceAuthor: string;
  targetAuthor: string;
}

export interface Thread {
  rootId: string;
  nodes: ThreadNode[];
  edges: ThreadEdge[];
  authorCount: number;
  nodeCount: number;
  maxDepth: number;
  note: string;
}

export interface NetworkWindow {
  nodes: number;
  edges: number;
  density: number;
  components: number;
  inDegreeMean: number;
  inDegreeMax: number;
  degreeGini: number;
  hubDominance: number;
  communities: number;
  modularity: number;
  cascade: number;
  replyLinks: number;
}

export interface SentimentExample {
  kind: "positive" | "negative" | "neutral";
  label: string;
  text: string;
  translation: string;
  note: string;
  score: number;
  sentiment: SentimentLabel;
  slot: string;
  likes: number;
}

export interface CleaningExample {
  label: string;
  slot: string;
  raw: string;
  clean: string;
  translation: string;
  operations: string[];
  note: string;
  author: string;
}

export interface DedupExample {
  label: string;
  text: string;
  author: string;
  timestamp: number;
  keptId: string;
  droppedId: string;
  slot: string;
  note: string;
}

export interface RawComment {
  id: string;
  parent: string;
  author: string;
  author_id: string;
  text: string;
  like_count: number;
  timestamp: number;
}

export interface Transcript {
  text: string;
  translation: string;
  note: string;
}

export interface CaseStudy {
  id: CaseKey;
  name: string;
  person: string;
  handle: string;
  role: string;
  short: string;
  accent: string;
  trigger: string;
  triggerDetail: string;
  outcome: string;
  apologyTitleEn: string;
  opening: string;
  raw: number;
  empty: number;
  duplicates: number;
  nonEmpty: number;
  analyzed: number;
  labelCounts: Record<SentimentLabel, number>;
  replyLinks: Record<WindowKey, number>;
  windows: Record<WindowKey, WindowSummary>;
  slots: Slot[];
  recovery: {
    slotMean: Record<WindowKey, number>;
    nadirSlot: string;
    nadirValue: number;
    recoverySlot: string;
    pctCancelVsPre: number;
    pctPostVsPre: number;
  };
  network: {
    windows: Record<WindowKey, NetworkWindow>;
    amplification: {
      edges: number;
      nodes: number;
      density: number;
      gini: number;
    };
    thread: Thread;
  };
  sentimentExamples: SentimentExample[];
  cleaningExamples: CleaningExample[];
  dedup: DedupExample;
  rawComment: RawComment;
  transcript: Transcript;
  apology: Slot;
  transcriptNote: string;
}

export interface PearsonMetric {
  key: string;
  label: string;
  description: string;
  bodeoum_tv: { r: number; p: number; sig: boolean };
  mimiminu: { r: number; p: number; sig: boolean };
}

export interface Evaluation {
  shapiro: Record<CaseKey, { p: string; normal: boolean }> & { note: string };
  kruskal: Record<CaseKey, { H: number; df: number; p: string }>;
  dunn: Record<CaseKey, Array<{ a: WindowKey; b: WindowKey; p: string; sig: boolean }>> & {
    note: string;
  };
  pearson: PearsonMetric[];
}

export interface SiteData {
  meta: {
    title: string;
    subtitle: string;
    venue: string;
    authors: string[];
    affiliation: string;
    raw: number;
    empty: number;
    duplicates: number;
    analyzed: number;
    cases: number;
    slots: number;
    scrape: string;
    paper: string;
    slides: string;
    repo: string;
  };
  cases: Record<CaseKey, CaseStudy>;
  evaluation: Evaluation;
}
