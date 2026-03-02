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

  const nourriture = gauges['nourriture'] ?? 50
  const hungerModifier = nourriture > 50 ? 0 : nourriture >= 25 ? 10 : 25

  const risk = gaugeLevel - (statValue * 15) + hungerModifier

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
