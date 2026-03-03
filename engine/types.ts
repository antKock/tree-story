// Pure type definitions — zero imports from components/, hooks/, app/, or lib/

export class StoryValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StoryValidationError'
  }
}

export class EngineError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EngineError'
  }
}

export interface StatDefinition {
  id: string
  name: string
  description?: string
  maxPerStat: number
}

export interface GaugeDefinition {
  id: string
  name: string
  icon: string
  initialValue: number
  isScore: boolean
  isHidden: boolean
  maxValue?: number
  gameOverThreshold?: number
  gameOverCondition?: 'above' | 'below'
  gameOverParagraphId?: string
}

export interface GaugeEffect {
  gaugeId: string
  delta: number
  statInfluence?: {
    statId: string
    multiplier: number
  }
}

export interface DecayRule {
  gaugeId: string
  amount: number
  statReductionId?: string
  statReductionFormula?: string
  probabilityChance?: number
}

export interface OutcomeBranch {
  id: string
  label?: string
  maxRisk: number
  text: string
  effects: GaugeEffect[]
}

export interface WeightedOutcome {
  gaugeId: string
  statId: string
  outcomes: OutcomeBranch[]
  /** Multiplier applied to statValue in the risk formula: risk = gaugeLevel - (statValue * statMultiplier). Defaults to 15. */
  statMultiplier?: number
  /** Gauge ID to read for hunger modifier. When set, low values increase risk. Story-specific (e.g. 'nourriture'). */
  hungerGaugeId?: string
}

export interface GaugeCondition {
  gaugeId: string
  min?: number
  max?: number
}

export interface ScoreMultiplierRule {
  conditions: GaugeCondition[]
  multiplier: number
}

export interface ContextualGameOver {
  gaugeId: string
  threshold: number
  condition: 'above' | 'below'
  probability?: number
  targetParagraphId: string
}

export interface ConditionalBranch {
  probability: number
  targetParagraphId: string
}

export interface CompositeGameOverRule {
  paragraphScope?: string[]
  conditions: GaugeCondition[]
  probability?: number
  targetParagraphId: string
}

export interface Choice {
  id: string
  text: string
  targetParagraphId: string
  gaugeEffects?: GaugeEffect[]
  weightedOutcome?: WeightedOutcome
  inventoryAdd?: string[]
  inventoryRemove?: string[]
  conditionalBranch?: ConditionalBranch
}

export interface Paragraph {
  id: string
  content: string
  choices: Choice[]
  isGameOver?: boolean
  isComplete?: boolean
  contextualGameOver?: ContextualGameOver[]
}

export interface ActDefinition {
  id: string
  name: string
  paragraphIds: string[]
  theme: Record<string, string>
}

export interface EndStateTier {
  minScore: number
  maxScore: number
  text: string
}

export interface ExampleProfile {
  name: string
  stats: Record<string, number>
  description: string
}

export interface StoryMeta {
  title: string
  author: string
  version: string
  description?: string
  introText?: string
  exampleProfiles: ExampleProfile[]
}

export interface StoryConfig {
  id: string
  version: number
  meta: StoryMeta
  startParagraphId: string
  statPointBudget: number
  stats: StatDefinition[]
  gauges: GaugeDefinition[]
  acts: ActDefinition[]
  decayNodes: string[]
  decayRules: DecayRule[]
  paragraphs: Record<string, Paragraph>
  endStateTiers: EndStateTier[]
  scoreMultipliers?: ScoreMultiplierRule[]
  compositeGameOverRules?: CompositeGameOverRule[]
}

export interface EngineState {
  storyId: string
  paragraphId: string
  gauges: Record<string, number>
  stats: Record<string, number>
  act: string
  inventory: string[]
  score: number
  isGameOver: boolean
  gameOverParagraphId: string | null
  isComplete: boolean
  lastOutcomeText: string | null
  lastGaugeDeltas: Record<string, number> | null
}

export interface SaveState {
  storyId: string
  version: number
  savedAt: number
  engineState: EngineState
}
