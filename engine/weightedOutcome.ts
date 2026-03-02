// Pure engine module — zero imports from components/, hooks/, or app/
import type { WeightedOutcome, OutcomeBranch, StoryConfig } from './types'

export function resolveOutcome(
  outcome: WeightedOutcome,
  gauges: Record<string, number>,
  stats: Record<string, number>,
  _config: StoryConfig
): OutcomeBranch {
  const gaugeLevel = gauges[outcome.gaugeId] ?? 0
  const statValue = stats[outcome.statId] ?? 0
  const statMultiplier = outcome.statMultiplier ?? 15

  // Hunger modifier: story-specific, only applied when hungerGaugeId is configured on this outcome.
  // NOTE: The modifier thresholds (50/25 → 0/10/25) are fixed design constants for the current engine.
  // A future multi-story engine supporting custom modifier curves would need a formula field.
  let hungerModifier = 0
  if (outcome.hungerGaugeId) {
    const hungerValue = gauges[outcome.hungerGaugeId] ?? 50
    hungerModifier = hungerValue > 50 ? 0 : hungerValue >= 25 ? 10 : 25
  }

  const risk = gaugeLevel - (statValue * statMultiplier) + hungerModifier

  const goodProbability = risk < 30 ? 0.9 : risk <= 55 ? 0.6 : risk <= 75 ? 0.4 : 0.2

  const r = Math.random()
  const n = outcome.outcomes.length

  if (n === 1) return outcome.outcomes[0]

  // outcome[0] occupies [0, goodProbability)
  if (r < goodProbability) return outcome.outcomes[0]

  // Remaining outcomes[1..n-1] split [goodProbability, 1) equally
  const badZoneWidth = (1 - goodProbability) / (n - 1)
  const badIndex = 1 + Math.floor((r - goodProbability) / badZoneWidth)
  return outcome.outcomes[Math.min(badIndex, n - 1)]
}
