// Pure engine module — zero imports from components/, hooks/, app/, or lib/
import type { GaugeEffect, DecayRule, StoryConfig } from './types'
import { evaluateFormula } from './formulaParser'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function getMaxValue(gaugeId: string, config: StoryConfig): number {
  const gauge = config.gauges.find(g => g.id === gaugeId)
  return gauge?.maxValue ?? 100
}

export function applyGaugeEffects(
  gauges: Record<string, number>,
  effects: GaugeEffect[],
  stats: Record<string, number>,
  config: StoryConfig
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

    result[effect.gaugeId] = clamp(result[effect.gaugeId] + delta, 0, getMaxValue(effect.gaugeId, config))
  }

  return result
}

export function applyDecay(
  gauges: Record<string, number>,
  decayRules: DecayRule[],
  stats: Record<string, number>,
  config: StoryConfig
): Record<string, number> {
  const result = { ...gauges }

  for (const rule of decayRules) {
    if (!(rule.gaugeId in result)) continue

    // Probabilistic decay (e.g., 6% passive energy risk)
    if (rule.probabilityChance !== undefined) {
      if (Math.random() < rule.probabilityChance) {
        result[rule.gaugeId] = clamp(result[rule.gaugeId] + rule.amount, 0, getMaxValue(rule.gaugeId, config))
      }
      continue
    }

    let amount = rule.amount

    // Stat-reduction formula (e.g., Nourriture decay reduced by Estomac)
    // The formula is dynamically evaluated from the story JSON.
    // Available variables: `base` (absolute decay amount), `stat` (stat value),
    // and the stat name itself (e.g. `estomac`).
    // Convention: `amount` in DecayRule is negative (decay). The formula returns
    // the decay magnitude (positive). The result is negated to produce a negative delta.
    // If the formula returns a negative value, Math.abs ensures decay never heals.
    if (rule.statReductionId && rule.statReductionFormula) {
      const statValue = stats[rule.statReductionId] ?? 0
      const variables: Record<string, number> = {
        base: Math.abs(rule.amount),
        stat: statValue,
        [rule.statReductionId]: statValue,
      }
      amount = -Math.abs(evaluateFormula(rule.statReductionFormula, variables))
    }

    result[rule.gaugeId] = clamp(result[rule.gaugeId] + amount, 0, getMaxValue(rule.gaugeId, config))
  }

  return result
}
