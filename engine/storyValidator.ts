// Pure engine module — zero imports from components/, hooks/, app/, or lib/
import {
  StoryConfig,
  StoryValidationError,
  StoryMeta,
  StatDefinition,
  GaugeDefinition,
  GaugeEffect,
  WeightedOutcome,
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

  let gameOverParagraphId: string | undefined
  if ('gameOverParagraphId' in data && isString(data['gameOverParagraphId'])) {
    gameOverParagraphId = data['gameOverParagraphId']
  }

  return { id, name, icon, initialValue, isScore, isHidden, gameOverThreshold, gameOverCondition, gameOverParagraphId }
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

function validateWeightedOutcome(data: unknown, context: string): WeightedOutcome {
  if (!isObject(data)) {
    throw new StoryValidationError(
      `Invalid story config: weightedOutcome in ${context} must be an object`
    )
  }
  const gaugeId = requireString(data, 'gaugeId', context)
  const statId = requireString(data, 'statId', context)
  const goodEffectsRaw = requireArray(data, 'goodEffects', context)
  const badEffectsRaw = requireArray(data, 'badEffects', context)
  const goodEffects = goodEffectsRaw.map((e, i) =>
    validateGaugeEffect(e, `${context}.goodEffects[${i}]`)
  )
  const badEffects = badEffectsRaw.map((e, i) =>
    validateGaugeEffect(e, `${context}.badEffects[${i}]`)
  )
  return { gaugeId, statId, goodEffects, badEffects }
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

  return { id, text, targetParagraphId, gaugeEffects, weightedOutcome, inventoryAdd, inventoryRemove }
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

  return { id, content, choices, isGameOver, isComplete }
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

  // ── Referential integrity ────────────────────────────────────────────────
  const paragraphIdSet = new Set(Object.keys(paragraphs))

  // Every choice.targetParagraphId must reference an existing paragraph
  for (const [pid, paragraph] of Object.entries(paragraphs)) {
    for (const choice of paragraph.choices) {
      if (!paragraphIdSet.has(choice.targetParagraphId)) {
        throw new StoryValidationError(
          `Invalid story config: choice '${choice.id}' in paragraph '${pid}' references non-existent targetParagraphId '${choice.targetParagraphId}'`
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
  }
}
