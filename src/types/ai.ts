export interface Recommendation {
  id: string;
  name: string;
  score: number;
  reason: string;
  imageUrl?: string;
  category?: string;
}

export interface RewardSignal {
  sessionId: string;
  nodeId: string;
  engagementScore: number;
  timestamp: number;
}

export interface HeatmapData {
  [nodeId: string]: number;
}

export interface GuideAnswer {
  answer: string;
  sourceSection: string;
  confidence: number;
  synth?: 'anthropic' | 'openai' | 'extractive' | 'fallback' | 'none' | string;
}

export interface GuideMessage {
  role:    'user' | 'guide';
  content: string;
  ts:      number;
  sourceSection?: string;
  confidence?:    number;
  synth?:         string;
}

export interface NavigationSuggestion {
  nodeId: string;
  confidence: number;
  reason: string;
}
