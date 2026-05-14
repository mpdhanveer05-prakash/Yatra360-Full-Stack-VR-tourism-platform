export interface EngagementInput {
  dwellMs:          number
  interactionCount: number
  revisited:        boolean
  /**
   * Optional active-attention ratio in [0,1] — fraction of dwell time the user
   * was actively pointing/moving the cursor (proxy for gaze/attention).
   * If omitted, treated as 1.0 (full credit).
   */
  attentionRatio?:  number
}

export function computeEngagementScore({
  dwellMs, interactionCount, revisited, attentionRatio = 1,
}: EngagementInput): number {
  const dwellScore    = Math.min(dwellMs / 120_000, 1)
  const interactScore = Math.min(interactionCount / 5, 1)
  const revisitBonus  = revisited ? 0.2 : 0
  const attentionMult = 0.5 + 0.5 * Math.max(0, Math.min(1, attentionRatio))
  return (dwellScore * 0.5 + interactScore * 0.3 + revisitBonus) * attentionMult
}
