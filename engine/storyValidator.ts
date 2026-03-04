// Pure engine module — zero imports from components/, hooks/, app/, or lib/
import {
  StoryConfig,
  StoryValidationError,
  StoryMeta,
  StatDefinition,
  GaugeDefinition,
  GaugeEffect,
  OutcomeBranch,
  WeightedOutcome,
  GaugeCondition,
  ScoreMultiplierRule,
  ContextualGameOver,
  ConditionalBranch,
  CompositeGameOverRule,
  Choice,
  Paragraph,
  ActDefinition,
  DecayRule,
  EndStateTier,
  ExampleProfile,
} from './types'

// ─── Type guards ────────────────────────────────────────────────────────────

function isString(v: unknown): v is string {
  return typeof v === 'string'
}

function isNumber(v: unknown): v is number {
  return typeof v === 'number'
}

function isBoolean(v: unknown): v is boolean {
  return typeof v === 'boolean'
}

function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v)
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

// ─── Field helpers ───────────────────────────────────────────────────────────

function requireField(obj: Record<string, unknown>, field: string, context: string): unknown {
  if (!(field in obj)) {
    throw new StoryValidationError(
      `Invalid story config: missing required field '${field}' in ${context}`
    )
  }
  return obj[field]
}

function requireString(obj: Record<string, unknown>, field: string, context: string): string {
  const v = requireField(obj, field, context)
  if (!isString(v)) {
    throw new StoryValidationError(
      `Invalid story config: '${field}' in ${context} must be a string`
    )
  }
  return v
}

function requireNumber(obj: Record<string, unknown>, field: string, context: string): number {
  const v = requireField(obj, field, context)
  if (!isNumber(v)) {
    throw new StoryValidationError(
      `Invalid story config: '${field}' in ${context} must be a number`
    )
  }
  return v
}

function requireBoolean(obj: Record<string, unknown>, field: string, context: string): boolean {
  const v = requireField(obj, field, context)
  if (!isBoolean(v)) {
    throw new StoryValidationError(
      `Invalid story config: '${field}' in ${context} must be a boolean`
    )
  }
  return v
}

function requireArray(
  obj: Record<string, unknown>,
  field: string,
  context: string
): unknown[] {
  const v = requireField(obj, field, context)
  if (!isArray(v)) {
    throw new StoryValidationError(
      `Invalid story config: '${field}' in ${context} must be an array`
    )
  }
  return v
}

function requireObject(
  obj: Record<string, unknown>,
  field: string,
  context: string
): Record<string, unknown> {
  const v = requireField(obj, field, context)
  if (!isObject(v)) {
    throw new StoryValidationError(
      `Invalid story config: '${field}' in ${context} must be an object`
    )
  }
  return v
}

// ─── Sub-validators ──────────────────────────────────────────────────────────

function validateExampleProfile(data: unknown, context: string): ExampleProfile {
  if (!isObject(data)) {
    throw new StoryValidationError(
      `Invalid story config: example profile in ${context} must be an object`
    )
  }
  const name = requireString(data, 'name', context)
  const description = requireString(data, 'description', context)
  const statsRaw = requireObject(data, 'stats', context)
  const stats: Record<string, number> = {}
  for (const [k, v] of Object.entries(statsRaw)) {
    if (!isNumber(v)) {
      throw new StoryValidationError(
        `Invalid story config: stat '${k}' in example profile '${name}' must be a number`
      )
    }
    stats[k] = v
  }
  return { name, description, stats }
}

function validateMeta(data: unknown): StoryMeta {
  if (!isObject(data)) {
    throw new StoryValidationError(`Invalid story config: 'meta' must be an object`)
  }
  const title = requireString(data, 'title', 'meta')
  const author = requireString(data, 'author', 'meta')
  const version = requireString(data, 'version', 'meta')
  const description = isString(data['description']) ? data['description'] : undefined
  const profilesRaw = requireArray(data, 'exampleProfiles', 'meta')
  const exampleProfiles = profilesRaw.map((p, i) =>
    validateExampleProfile(p, `meta.exampleProfiles[${i}]`)
  )
  return { title, author, version, description, exampleProfiles }
}

function validateStat(data: unknown, index: number): StatDefinition {
  if (!isObject(data)) {
    throw new StoryValidationError(
      `Invalid story config: stats[${index}] must be an object`
    )
  }
  const id = requireString(data, 'id', `stats[${index}]`)
  const name = requireString(data, 'name', `stats[${index}]`)
  const maxPerStat = requireNumber(data, 'maxPerStat', `stats[${index}]`)
  const description = isString(data['description']) ? data['description'] : undefined
  return { id, name, maxPerStat, description }
}

function validateGauge(data: unknown, index: number): GaugeDefinition {
  if (!isObject(data)) {
    throw new StoryValidationError(
      `Invalid story config: gauges[${index}] must be an object`
    )
  }
  const id = requireString(data, 'id', `gauges[${index}]`)
  const name = requireString(data, 'name', `gauges[${index}]`)
  const icon = requireString(data, 'icon', `gauges[${index}]`)
  const initialValue = requireNumber(data, 'initialValue', `gauges[${index}]`)
  const isScore = requireBoolean(data, 'isScore', `gauges[${index}]`)
  const isHidden = requireBoolean(data, 'isHidden', `gauges[${index}]`)

  let gameOverThreshold: number | undefined
  let gameOverCondition: 'above' | 'below' | undefined

  if ('gameOverThreshold' in data) {
    const t = data['gameOverThreshold']
    if (!isNumber(t)) {
      throw new StoryValidationError(
        `Invalid story config: 'gameOverThreshold' in gauges[${index}] (id: '${id}') must be a number`
      )
    }
    gameOverThreshold = t
  }

  if ('gameOverCondition' in data) {
    const c = data['gameOverCondition']
    if (c !== 'above' && c !== 'below') {
      throw new StoryValidationError(
        `Invalid story config: 'gameOverCondition' in gauges[${index}] (id: '${id}') must be 'above' or 'below'`
      )
    }
    gameOverCondition = c
  }

  let maxValue: number | undefined
  if ('maxValue' in data) {
    const mv = data['maxValue']
    if (!isNumber(mv) || mv <= 0) {
      throw new StoryValidationError(
        `Invalid story config: 'maxValue' in gauges[${index}] (id: '${id}') must be a positive number`
      )
    }
    maxValue = mv
  }

  let gameOverParagraphId: string | undefined
  if ('gameOverParagraphId' in data && isString(data['gameOverParagraphId'])) {
    gameOverParagraphId = data['gameOverParagraphId']
  }

  // M2: gameOverParagraphId is required when gameOverThreshold is set
  if (gameOverThreshold !== undefined && !gameOverParagraphId) {
    throw new StoryValidationError(
      `Invalid story config: gauge '${id}' has gameOverThreshold but no gameOverParagraphId`
    )
  }

  return { id, name, icon, initialValue, isScore, isHidden, maxValue, gameOverThreshold, gameOverCondition, gameOverParagraphId }
}

function validateGaugeEffect(data: unknown, context: string): GaugeEffect {
  if (!isObject(data)) {
    throw new StoryValidationError(
      `Invalid story config: gauge effect in ${context} must be an object`
    )
  }
  const gaugeId = requireString(data, 'gaugeId', context)
  const delta = requireNumber(data, 'delta', context)

  let statInfluence: { statId: string; multiplier: number } | undefined
  if ('statInfluence' in data && data['statInfluence'] !== null && data['statInfluence'] !== undefined) {
    if (!isObject(data['statInfluence'])) {
      throw new StoryValidationError(
        `Invalid story config: 'statInfluence' in ${context} must be an object`
      )
    }
    const si = data['statInfluence']
    statInfluence = {
      statId: requireString(si, 'statId', `${context}.statInfluence`),
      multiplier: requireNumber(si, 'multiplier', `${context}.statInfluence`),
    }
  }

  return { gaugeId, delta, statInfluence }
}

function validateOutcomeBranch(data: unknown, context: string): OutcomeBranch {
  if (!isObject(data)) {
    throw new StoryValidationError(
      `Invalid story config: outcome branch in ${context} must be an object`
    )
  }
  const id = requireString(data, 'id', context)
  const maxRisk = requireNumber(data, 'maxRisk', context)
  if (maxRisk < 0 || maxRisk > 100) {
    throw new StoryValidationError(
      `Invalid story config: 'maxRisk' in ${context} must be between 0 and 100`
    )
  }
  const text = requireString(data, 'text', context)
  const effectsRaw = requireArray(data, 'effects', context)
  const effects = effectsRaw.map((e, i) =>
    validateGaugeEffect(e, `${context}.effects[${i}]`)
  )
  const label = isString(data['label']) ? data['label'] : undefined
  return { id, label, maxRisk, text, effects }
}

function validateWeightedOutcome(data: unknown, context: string): WeightedOutcome {
  if (!isObject(data)) {
    throw new StoryValidationError(
      `Invalid story config: weightedOutcome in ${context} must be an object`
    )
  }

  // Reject old goodEffects/badEffects shape
  if ('goodEffects' in data || 'badEffects' in data) {
    throw new StoryValidationError(
      `Invalid story config: weightedOutcome in ${context} uses deprecated goodEffects/badEffects — migrate to outcomes array`
    )
  }

  const gaugeId = requireString(data, 'gaugeId', context)
  const statId = requireString(data, 'statId', context)
  const outcomesRaw = requireArray(data, 'outcomes', context)
  if (outcomesRaw.length === 0) {
    throw new StoryValidationError(
      `Invalid story config: 'outcomes' in ${context} must have at least 1 entry`
    )
  }
  const outcomes = outcomesRaw.map((o, i) =>
    validateOutcomeBranch(o, `${context}.outcomes[${i}]`)
  )
  // Last outcome's maxRisk must be >= 100
  if (outcomes[outcomes.length - 1].maxRisk < 100) {
    throw new StoryValidationError(
      `Invalid story config: last outcome branch in ${context} must have maxRisk >= 100`
    )
  }

  let statMultiplier: number | undefined
  if ('statMultiplier' in data) {
    if (!isNumber(data['statMultiplier'])) {
      throw new StoryValidationError(
        `Invalid story config: 'statMultiplier' in ${context} must be a number`
      )
    }
    if ((data['statMultiplier'] as number) <= 0) {
      throw new StoryValidationError(
        `Invalid story config: 'statMultiplier' in ${context} must be greater than 0`
      )
    }
    statMultiplier = data['statMultiplier'] as number
  }

  let hungerGaugeId: string | undefined
  if ('hungerGaugeId' in data && isString(data['hungerGaugeId'])) {
    hungerGaugeId = data['hungerGaugeId']
  }

  return { gaugeId, statId, outcomes, statMultiplier, hungerGaugeId }
}

function validateGaugeCondition(data: unknown, context: string): GaugeCondition {
  if (!isObject(data)) {
    throw new StoryValidationError(
      `Invalid story config: gauge condition in ${context} must be an object`
    )
  }
  const gaugeId = requireString(data, 'gaugeId', context)
  let min: number | undefined
  let max: number | undefined
  if ('min' in data) {
    if (!isNumber(data['min'])) {
      throw new StoryValidationError(
        `Invalid story config: 'min' in ${context} must be a number`
      )
    }
    min = data['min']
  }
  if ('max' in data) {
    if (!isNumber(data['max'])) {
      throw new StoryValidationError(
        `Invalid story config: 'max' in ${context} must be a number`
      )
    }
    max = data['max']
  }
  return { gaugeId, min, max }
}

function validateScoreMultiplierRule(data: unknown, context: string): ScoreMultiplierRule {
  if (!isObject(data)) {
    throw new StoryValidationError(
      `Invalid story config: score multiplier rule in ${context} must be an object`
    )
  }
  const conditionsRaw = requireArray(data, 'conditions', context)
  const conditions = conditionsRaw.map((c, i) =>
    validateGaugeCondition(c, `${context}.conditions[${i}]`)
  )
  const multiplier = requireNumber(data, 'multiplier', context)
  if (multiplier <= 0) {
    throw new StoryValidationError(
      `Invalid story config: 'multiplier' in ${context} must be greater than 0`
    )
  }
  return { conditions, multiplier }
}

function validateContextualGameOver(data: unknown, context: string): ContextualGameOver {
  if (!isObject(data)) {
    throw new StoryValidationError(
      `Invalid story config: contextual game over in ${context} must be an object`
    )
  }
  const gaugeId = requireString(data, 'gaugeId', context)
  const threshold = requireNumber(data, 'threshold', context)
  const conditionRaw = requireString(data, 'condition', context)
  if (conditionRaw !== 'above' && conditionRaw !== 'below') {
    throw new StoryValidationError(
      `Invalid story config: 'condition' in ${context} must be 'above' or 'below'`
    )
  }
  const condition = conditionRaw as 'above' | 'below'
  const targetParagraphId = requireString(data, 'targetParagraphId', context)
  let probability: number | undefined
  if ('probability' in data) {
    if (!isNumber(data['probability'])) {
      throw new StoryValidationError(
        `Invalid story config: 'probability' in ${context} must be a number`
      )
    }
    probability = data['probability']
    if (probability < 0 || probability > 1) {
      throw new StoryValidationError(
        `Invalid story config: 'probability' in ${context} must be between 0.0 and 1.0`
      )
    }
  }
  return { gaugeId, threshold, condition, probability, targetParagraphId }
}

function validateConditionalBranch(data: unknown, context: string): ConditionalBranch {
  if (!isObject(data)) {
    throw new StoryValidationError(
      `Invalid story config: conditional branch in ${context} must be an object`
    )
  }
  const probability = requireNumber(data, 'probability', context)
  if (probability < 0 || probability > 1) {
    throw new StoryValidationError(
      `Invalid story config: 'probability' in ${context} must be between 0.0 and 1.0`
    )
  }
  const targetParagraphId = requireString(data, 'targetParagraphId', context)
  return { probability, targetParagraphId }
}

function validateCompositeGameOverRule(data: unknown, context: string): CompositeGameOverRule {
  if (!isObject(data)) {
    throw new StoryValidationError(
      `Invalid story config: composite game over rule in ${context} must be an object`
    )
  }
  let paragraphScope: string[] | undefined
  if ('paragraphScope' in data && isArray(data['paragraphScope'])) {
    paragraphScope = data['paragraphScope'].map((pid, i) => {
      if (!isString(pid)) {
        throw new StoryValidationError(
          `Invalid story config: paragraphScope[${i}] in ${context} must be a string`
        )
      }
      return pid
    })
  }
  const conditionsRaw = requireArray(data, 'conditions', context)
  const conditions = conditionsRaw.map((c, i) =>
    validateGaugeCondition(c, `${context}.conditions[${i}]`)
  )
  const targetParagraphId = requireString(data, 'targetParagraphId', context)
  let probability: number | undefined
  if ('probability' in data) {
    if (!isNumber(data['probability'])) {
      throw new StoryValidationError(
        `Invalid story config: 'probability' in ${context} must be a number`
      )
    }
    probability = data['probability']
    if (probability < 0 || probability > 1) {
      throw new StoryValidationError(
        `Invalid story config: 'probability' in ${context} must be between 0.0 and 1.0`
      )
    }
  }
  return { paragraphScope, conditions, probability, targetParagraphId }
}

function validateChoice(data: unknown, paragraphId: string, index: number): Choice {
  if (!isObject(data)) {
    throw new StoryValidationError(
      `Invalid story config: choice[${index}] in paragraph '${paragraphId}' must be an object`
    )
  }
  const id = requireString(data, 'id', `paragraph '${paragraphId}' choice[${index}]`)
  const text = requireString(data, 'text', `paragraph '${paragraphId}' choice '${id}'`)
  const targetParagraphId = requireString(
    data,
    'targetParagraphId',
    `paragraph '${paragraphId}' choice '${id}'`
  )

  let gaugeEffects: GaugeEffect[] | undefined
  if ('gaugeEffects' in data && isArray(data['gaugeEffects'])) {
    gaugeEffects = data['gaugeEffects'].map((e, i) =>
      validateGaugeEffect(e, `paragraph '${paragraphId}' choice '${id}' gaugeEffects[${i}]`)
    )
  }

  let weightedOutcome: WeightedOutcome | undefined
  if (
    'weightedOutcome' in data &&
    data['weightedOutcome'] !== null &&
    data['weightedOutcome'] !== undefined
  ) {
    weightedOutcome = validateWeightedOutcome(
      data['weightedOutcome'],
      `paragraph '${paragraphId}' choice '${id}' weightedOutcome`
    )
  }

  let inventoryAdd: string[] | undefined
  if ('inventoryAdd' in data && isArray(data['inventoryAdd'])) {
    inventoryAdd = data['inventoryAdd'].map((item, i) => {
      if (!isString(item)) {
        throw new StoryValidationError(
          `Invalid story config: inventoryAdd[${i}] in paragraph '${paragraphId}' choice '${id}' must be a string`
        )
      }
      return item
    })
  }

  let inventoryRemove: string[] | undefined
  if ('inventoryRemove' in data && isArray(data['inventoryRemove'])) {
    inventoryRemove = data['inventoryRemove'].map((item, i) => {
      if (!isString(item)) {
        throw new StoryValidationError(
          `Invalid story config: inventoryRemove[${i}] in paragraph '${paragraphId}' choice '${id}' must be a string`
        )
      }
      return item
    })
  }

  let conditionalBranch: ConditionalBranch | undefined
  if (
    'conditionalBranch' in data &&
    data['conditionalBranch'] !== null &&
    data['conditionalBranch'] !== undefined
  ) {
    conditionalBranch = validateConditionalBranch(
      data['conditionalBranch'],
      `paragraph '${paragraphId}' choice '${id}' conditionalBranch`
    )
  }

  return { id, text, targetParagraphId, gaugeEffects, weightedOutcome, inventoryAdd, inventoryRemove, conditionalBranch }
}

function validateParagraph(data: unknown, paragraphId: string): Paragraph {
  if (!isObject(data)) {
    throw new StoryValidationError(
      `Invalid story config: paragraph '${paragraphId}' must be an object`
    )
  }
  const id = requireString(data, 'id', `paragraph '${paragraphId}'`)
  const content = requireString(data, 'content', `paragraph '${paragraphId}'`)
  const choicesRaw = requireArray(data, 'choices', `paragraph '${paragraphId}'`)
  const choices = choicesRaw.map((c, i) => validateChoice(c, paragraphId, i))

  const isGameOver =
    'isGameOver' in data && isBoolean(data['isGameOver']) ? data['isGameOver'] : undefined
  const isComplete =
    'isComplete' in data && isBoolean(data['isComplete']) ? data['isComplete'] : undefined

  let contextualGameOver: ContextualGameOver[] | undefined
  if ('contextualGameOver' in data && isArray(data['contextualGameOver'])) {
    contextualGameOver = data['contextualGameOver'].map((cgo, i) =>
      validateContextualGameOver(cgo, `paragraph '${paragraphId}' contextualGameOver[${i}]`)
    )
  }

  let gaugeEffects: GaugeEffect[] | undefined
  if ('gaugeEffects' in data && isArray(data['gaugeEffects'])) {
    gaugeEffects = data['gaugeEffects'].map((e, i) =>
      validateGaugeEffect(e, `paragraph '${paragraphId}' gaugeEffects[${i}]`)
    )
  }

  return { id, content, choices, isGameOver, isComplete, contextualGameOver, gaugeEffects }
}

function validateAct(data: unknown, index: number): ActDefinition {
  if (!isObject(data)) {
    throw new StoryValidationError(
      `Invalid story config: acts[${index}] must be an object`
    )
  }
  const id = requireString(data, 'id', `acts[${index}]`)
  const name = requireString(data, 'name', `acts[${index}]`)
  const paragraphIdsRaw = requireArray(data, 'paragraphIds', `acts[${index}]`)
  const paragraphIds = paragraphIdsRaw.map((pid, i) => {
    if (!isString(pid)) {
      throw new StoryValidationError(
        `Invalid story config: acts[${index}].paragraphIds[${i}] must be a string`
      )
    }
    return pid
  })
  const themeRaw = requireObject(data, 'theme', `acts[${index}]`)
  const theme: Record<string, string> = {}
  for (const [k, v] of Object.entries(themeRaw)) {
    if (!isString(v)) {
      throw new StoryValidationError(
        `Invalid story config: acts[${index}] (id: '${id}') theme.${k} must be a string`
      )
    }
    theme[k] = v
  }
  return { id, name, paragraphIds, theme }
}

function validateDecayRule(data: unknown, index: number): DecayRule {
  if (!isObject(data)) {
    throw new StoryValidationError(
      `Invalid story config: decayRules[${index}] must be an object`
    )
  }
  const gaugeId = requireString(data, 'gaugeId', `decayRules[${index}]`)
  const amount = requireNumber(data, 'amount', `decayRules[${index}]`)
  const statReductionId =
    'statReductionId' in data && isString(data['statReductionId'])
      ? data['statReductionId']
      : undefined
  const statReductionFormula =
    'statReductionFormula' in data && isString(data['statReductionFormula'])
      ? data['statReductionFormula']
      : undefined
  let probabilityChance: number | undefined
  if ('probabilityChance' in data) {
    const pc = data['probabilityChance']
    if (!isNumber(pc)) {
      throw new StoryValidationError(
        `Invalid story config: 'probabilityChance' in decayRules[${index}] must be a number`
      )
    }
    if (pc < 0 || pc > 1) {
      throw new StoryValidationError(
        `Invalid story config: 'probabilityChance' in decayRules[${index}] must be between 0.0 and 1.0`
      )
    }
    probabilityChance = pc
  }
  return { gaugeId, amount, statReductionId, statReductionFormula, probabilityChance }
}

function validateEndStateTier(data: unknown, index: number): EndStateTier {
  if (!isObject(data)) {
    throw new StoryValidationError(
      `Invalid story config: endStateTiers[${index}] must be an object`
    )
  }
  const minScore = requireNumber(data, 'minScore', `endStateTiers[${index}]`)
  const maxScore = requireNumber(data, 'maxScore', `endStateTiers[${index}]`)
  const text = requireString(data, 'text', `endStateTiers[${index}]`)
  return { minScore, maxScore, text }
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Validates raw parsed JSON against the StoryConfig schema.
 * Returns a fully-typed StoryConfig on success.
 * Throws StoryValidationError with a specific message on any failure.
 */
export function validateStoryConfig(data: unknown): StoryConfig {
  if (!isObject(data)) {
    throw new StoryValidationError('Invalid story config: root must be an object')
  }

  // ── Top-level structural validation ─────────────────────────────────────
  const id = requireString(data, 'id', 'root')
  const version = requireNumber(data, 'version', 'root')
  const startParagraphId = requireString(data, 'startParagraphId', 'root')
  const statPointBudget = requireNumber(data, 'statPointBudget', 'root')

  const metaRaw = requireObject(data, 'meta', 'root')
  const meta = validateMeta(metaRaw)

  const statsRaw = requireArray(data, 'stats', 'root')
  if (statsRaw.length === 0) {
    throw new StoryValidationError(
      'Invalid story config: stats array must have at least 1 entry'
    )
  }
  const stats = statsRaw.map((s, i) => validateStat(s, i))

  const gaugesRaw = requireArray(data, 'gauges', 'root')
  if (gaugesRaw.length === 0) {
    throw new StoryValidationError(
      'Invalid story config: gauges array must have at least 1 entry'
    )
  }
  const gauges = gaugesRaw.map((g, i) => validateGauge(g, i))

  // Exactly one score gauge required
  const scoreGauges = gauges.filter(g => g.isScore)
  if (scoreGauges.length !== 1) {
    throw new StoryValidationError(
      `Invalid story config: exactly one gauge must have isScore: true, found ${scoreGauges.length}`
    )
  }

  // gameOverThreshold and gameOverCondition must both be present or both absent
  for (const gauge of gauges) {
    const hasThreshold = gauge.gameOverThreshold !== undefined
    const hasCondition = gauge.gameOverCondition !== undefined
    if (hasThreshold !== hasCondition) {
      throw new StoryValidationError(
        `Invalid story config: gauge '${gauge.id}' must define both gameOverThreshold and gameOverCondition, or neither`
      )
    }
  }

  const actsRaw = requireArray(data, 'acts', 'root')
  if (actsRaw.length === 0) {
    throw new StoryValidationError(
      'Invalid story config: acts array must have at least 1 entry'
    )
  }
  const acts = actsRaw.map((a, i) => validateAct(a, i))

  const decayNodesRaw = requireArray(data, 'decayNodes', 'root')
  const decayNodes = decayNodesRaw.map((d, i) => {
    if (!isString(d)) {
      throw new StoryValidationError(
        `Invalid story config: decayNodes[${i}] must be a string`
      )
    }
    return d
  })

  const decayRulesRaw = requireArray(data, 'decayRules', 'root')
  const decayRules = decayRulesRaw.map((r, i) => validateDecayRule(r, i))

  const paragraphsRaw = requireObject(data, 'paragraphs', 'root')
  const paragraphs: Record<string, Paragraph> = {}
  for (const [pid, pdata] of Object.entries(paragraphsRaw)) {
    paragraphs[pid] = validateParagraph(pdata, pid)
  }

  const endStateTiersRaw = requireArray(data, 'endStateTiers', 'root')
  const endStateTiers = endStateTiersRaw.map((t, i) => validateEndStateTier(t, i))

  let scoreMultipliers: ScoreMultiplierRule[] | undefined
  if ('scoreMultipliers' in data && isArray(data['scoreMultipliers'])) {
    scoreMultipliers = data['scoreMultipliers'].map((r, i) =>
      validateScoreMultiplierRule(r, `scoreMultipliers[${i}]`)
    )
  }

  let compositeGameOverRules: CompositeGameOverRule[] | undefined
  if ('compositeGameOverRules' in data && isArray(data['compositeGameOverRules'])) {
    compositeGameOverRules = data['compositeGameOverRules'].map((r, i) =>
      validateCompositeGameOverRule(r, `compositeGameOverRules[${i}]`)
    )
  }

  // ── Referential integrity ────────────────────────────────────────────────
  const paragraphIdSet = new Set(Object.keys(paragraphs))
  const gaugeIdSet = new Set(gauges.map(g => g.id))
  const statIdSet = new Set(stats.map(s => s.id))

  // Every choice.targetParagraphId must reference an existing paragraph
  for (const [pid, paragraph] of Object.entries(paragraphs)) {
    for (const choice of paragraph.choices) {
      if (!paragraphIdSet.has(choice.targetParagraphId)) {
        throw new StoryValidationError(
          `Invalid story config: choice '${choice.id}' in paragraph '${pid}' references non-existent targetParagraphId '${choice.targetParagraphId}'`
        )
      }
      // Validate conditionalBranch.targetParagraphId
      if (choice.conditionalBranch && !paragraphIdSet.has(choice.conditionalBranch.targetParagraphId)) {
        throw new StoryValidationError(
          `Invalid story config: choice '${choice.id}' in paragraph '${pid}' conditionalBranch references non-existent targetParagraphId '${choice.conditionalBranch.targetParagraphId}'`
        )
      }
    }
    // Validate contextualGameOver.targetParagraphId
    if (paragraph.contextualGameOver) {
      for (const cgo of paragraph.contextualGameOver) {
        if (!paragraphIdSet.has(cgo.targetParagraphId)) {
          throw new StoryValidationError(
            `Invalid story config: contextualGameOver in paragraph '${pid}' references non-existent targetParagraphId '${cgo.targetParagraphId}'`
          )
        }
      }
    }
  }

  // Validate compositeGameOverRules targetParagraphIds
  if (compositeGameOverRules) {
    for (const [i, rule] of compositeGameOverRules.entries()) {
      if (!paragraphIdSet.has(rule.targetParagraphId)) {
        throw new StoryValidationError(
          `Invalid story config: compositeGameOverRules[${i}] references non-existent targetParagraphId '${rule.targetParagraphId}'`
        )
      }
    }
  }

  // Every decayNodes entry must reference an existing paragraph
  for (const nodeId of decayNodes) {
    if (!paragraphIdSet.has(nodeId)) {
      throw new StoryValidationError(
        `Invalid story config: decayNodes references non-existent paragraph ID '${nodeId}'`
      )
    }
  }

  // Every act paragraphIds entry must reference an existing paragraph
  for (const act of acts) {
    for (const apid of act.paragraphIds) {
      if (!paragraphIdSet.has(apid)) {
        throw new StoryValidationError(
          `Invalid story config: act '${act.id}' references non-existent paragraphId '${apid}'`
        )
      }
    }
  }

  // Validate startParagraphId references an existing paragraph
  if (!paragraphIdSet.has(startParagraphId)) {
    throw new StoryValidationError(
      `Invalid story config: startParagraphId '${startParagraphId}' references non-existent paragraph`
    )
  }

  // H2: Every gauge.gameOverParagraphId must reference an existing paragraph
  for (const gauge of gauges) {
    if (gauge.gameOverParagraphId && !paragraphIdSet.has(gauge.gameOverParagraphId)) {
      throw new StoryValidationError(
        `Invalid story config: gauge '${gauge.id}' gameOverParagraphId '${gauge.gameOverParagraphId}' references non-existent paragraph`
      )
    }
  }

  // M3: Validate GaugeCondition gaugeIds in scoreMultipliers
  if (scoreMultipliers) {
    for (const [i, rule] of scoreMultipliers.entries()) {
      for (const [j, cond] of rule.conditions.entries()) {
        if (!gaugeIdSet.has(cond.gaugeId)) {
          throw new StoryValidationError(
            `Invalid story config: scoreMultipliers[${i}].conditions[${j}] references non-existent gauge '${cond.gaugeId}'`
          )
        }
      }
    }
  }

  // M3: Validate GaugeCondition gaugeIds in compositeGameOverRules
  if (compositeGameOverRules) {
    for (const [i, rule] of compositeGameOverRules.entries()) {
      for (const [j, cond] of rule.conditions.entries()) {
        if (!gaugeIdSet.has(cond.gaugeId)) {
          throw new StoryValidationError(
            `Invalid story config: compositeGameOverRules[${i}].conditions[${j}] references non-existent gauge '${cond.gaugeId}'`
          )
        }
      }
    }
  }

  // M3: Validate WeightedOutcome gaugeId/statId and ContextualGameOver gaugeId in paragraphs
  for (const [pid, paragraph] of Object.entries(paragraphs)) {
    for (const choice of paragraph.choices) {
      if (choice.weightedOutcome) {
        const wo = choice.weightedOutcome
        if (!gaugeIdSet.has(wo.gaugeId)) {
          throw new StoryValidationError(
            `Invalid story config: weightedOutcome in choice '${choice.id}' paragraph '${pid}' references non-existent gauge '${wo.gaugeId}'`
          )
        }
        if (!statIdSet.has(wo.statId)) {
          throw new StoryValidationError(
            `Invalid story config: weightedOutcome in choice '${choice.id}' paragraph '${pid}' references non-existent stat '${wo.statId}'`
          )
        }
        if (wo.hungerGaugeId !== undefined && !gaugeIdSet.has(wo.hungerGaugeId)) {
          throw new StoryValidationError(
            `Invalid story config: weightedOutcome in choice '${choice.id}' paragraph '${pid}' hungerGaugeId references non-existent gauge '${wo.hungerGaugeId}'`
          )
        }
      }
    }
    if (paragraph.contextualGameOver) {
      for (const [i, cgo] of paragraph.contextualGameOver.entries()) {
        if (!gaugeIdSet.has(cgo.gaugeId)) {
          throw new StoryValidationError(
            `Invalid story config: contextualGameOver[${i}] in paragraph '${pid}' references non-existent gauge '${cgo.gaugeId}'`
          )
        }
      }
    }
    if (paragraph.gaugeEffects) {
      for (const [i, effect] of paragraph.gaugeEffects.entries()) {
        if (!gaugeIdSet.has(effect.gaugeId)) {
          throw new StoryValidationError(
            `Invalid story config: gaugeEffects[${i}] in paragraph '${pid}' references non-existent gauge '${effect.gaugeId}'`
          )
        }
      }
    }
  }

  return {
    id,
    version,
    meta,
    startParagraphId,
    statPointBudget,
    stats,
    gauges,
    acts,
    decayNodes,
    decayRules,
    paragraphs,
    endStateTiers,
    scoreMultipliers,
    compositeGameOverRules,
  }
}
