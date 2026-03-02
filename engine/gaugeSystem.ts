// Pure engine module — zero imports from components/, hooks/, app/, or lib/
import type { GaugeEffect, DecayRule, StoryConfig } from './types'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function applyGaugeEffects(
  gauges: Record<string, number>,
  effects: GaugeEffect[],
  stats: Record<string, number>,
  _config: StoryConfig
): Record<string, number> {
  const result = { ...gauges }

  for (const effect of effects) {
    if (!(effect.gaugeId in result)) continue

    let delta = effect.delta
    if (effect.statInfluence) {
      const statValue = stats[effect.statInfluence.statId] ?? 0
      const adjusted = delta + (statValue * effect.statInfluence.multiplier)
      // Negative delta (cost): stat reduces cost toward zero but never flips sign
      // Positive delta (gain): stat amplifies gain freely
      delta = delta < 0 ? Math.min(0, adjusted) : adjusted
    }

    result[effect.gaugeId] = clamp(result[effect.gaugeId] + delta, 0, 100)
  }

  return result
}

export function applyDecay(
  gauges: Record<string, number>,
  decayRules: DecayRule[],
  stats: Record<string, number>,
  _config: StoryConfig
): Record<string, number> {
  const result = { ...gauges }

  for (const rule of decayRules) {
    if (!(rule.gaugeId in result)) continue

    // Probabilistic decay (e.g., 6% passive energy risk)
    if (rule.probabilityChance !== undefined) {
      if (Math.random() < rule.probabilityChance) {
        result[rule.gaugeId] = clamp(result[rule.gaugeId] + rule.amount, 0, 100)
      }
      continue
    }

    let amount = rule.amount

    // Stat-reduction formula (e.g., Nourriture decay reduced by Estomac)
    // NOTE: The formula is hardcoded to Dub Camp's max(3, base - stat * 1.5).
    // The statReductionFormula string field is stored but not dynamically evaluated.
    // A future story engine supporting multiple stories would need a formula parser.
    if (rule.statReductionId && rule.statReductionFormula) {
      const statValue = stats[rule.statReductionId] ?? 0
      amount = -Math.max(3, Math.abs(rule.amount) - statValue * 1.5)
    }

    result[rule.gaugeId] = clamp(result[rule.gaugeId] + amount, 0, 100)
  }

  return result
}
