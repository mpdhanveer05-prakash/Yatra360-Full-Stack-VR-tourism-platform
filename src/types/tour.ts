export type EventType =
  | 'node_enter'
  | 'node_exit'
  | 'hotspot_click'
  | 'vr_enter'
  | 'vr_exit'
  | 'guide_open'
  | 'guide_question'
  | 'location_start'
  | 'location_end';

export interface EngagementEvent {
  sessionId: string;
  userId: string;
  locationId: string;
  nodeId: string;
  eventType: EventType;
  dwellMs: number;
  interactionCount: number;
  timestamp: number;
}

export interface NavigationEvent {
  fromNodeId: string;
  toNodeId: string;
  timestamp: number;
  triggeredBy: 'hotspot' | 'recommendation' | 'direct';
}

export interface TourSession {
  sessionId: string;
  userId: string;
  locationId: string;
  startedAt: number;
  endedAt?: number;
  durationMs?: number;
  engagementScore: number;
  nodesVisited: string[];
  events: EngagementEvent[];
}
