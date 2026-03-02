// Pure engine module — zero imports from components/, hooks/, or app/
import type { WeightedOutcome, StoryConfig } from './types'

export function resolveOutcome(
  outcome: WeightedOutcome,
  gauges: Record<string, number>,
  stats: Record<string, number>,
  _config: StoryConfig
): 'good' | 'bad' {
  const gaugeLevel = gauges[outcome.gaugeId] ?? 0
  const statValue = stats[outcome.statId] ?? 0

  const nourriture = gauges['nourriture'] ?? 50
  const hungerModifier = nourriture > 50 ? 0 : nourriture >= 25 ? 10 : 25

  const risk = gaugeLevel - (statValue * 15) + hungerModifier

  const goodProbability = risk < 30 ? 0.9 : risk <= 55 ? 0.6 : risk <= 75 ? 0.4 : 0.2

  const roll = Math.random()
  return roll < goodProbability ? 'good' : 'bad'
}
