// Pure engine module — zero imports from components/, hooks/, or app/
import type { StoryConfig, EngineState, SaveState } from './types'
import { EngineError } from './types'
import { applyGaugeEffects, applyDecay as applyDecayRules } from './gaugeSystem'
import { resolveOutcome } from './weightedOutcome'

export interface Engine {
  getState(): EngineState
  resolveChoice(choiceId: string): EngineState
  applyDecay(): EngineState
  reset(): void
  setStats(stats: Record<string, number>): void
  serialize(): SaveState
}

function isValidSavedState(savedState: SaveState, config: StoryConfig): boolean {
  if (savedState.version !== 1) return false
  if (savedState.storyId !== config.id) return false

  const es = savedState.engineState
  if (!es) return false
  if (typeof es.paragraphId !== 'string') return false
  if (!(es.paragraphId in config.paragraphs)) return false
  if (typeof es.storyId !== 'string') return false
  if (typeof es.act !== 'string') return false
  if (typeof es.score !== 'number') return false
  if (typeof es.isGameOver !== 'boolean') return false
  if (typeof es.isComplete !== 'boolean') return false
  if (!es.gauges || typeof es.gauges !== 'object') return false
  if (!es.stats || typeof es.stats !== 'object') return false
  if (!Array.isArray(es.inventory)) return false

  return true
}

function deepCopyState(state: EngineState): EngineState {
  return {
    ...state,
    gauges: { ...state.gauges },
    stats: { ...state.stats },
    inventory: [...state.inventory],
  }
}

export function createEngine(config: StoryConfig, savedState?: SaveState): Engine {
  let _state: EngineState

  const scoreGauge = config.gauges.find(g => g.isScore)
  const scoreGaugeId = scoreGauge?.id

  function freshState(): EngineState {
    const gauges: Record<string, number> = {}
    for (const g of config.gauges) {
      gauges[g.id] = g.initialValue
    }

    return {
      storyId: config.id,
      paragraphId: config.startParagraphId,
      gauges,
      stats: {},
      act: config.acts[0].id,
      inventory: [],
      score: scoreGaugeId ? gauges[scoreGaugeId] : 0,
      isGameOver: false,
      gameOverParagraphId: null,
      isComplete: false,
    }
  }

  if (savedState && isValidSavedState(savedState, config)) {
    _state = deepCopyState(savedState.engineState)
  } else {
    _state = freshState()
  }

  function syncScore(): void {
    if (scoreGaugeId && scoreGaugeId in _state.gauges) {
      _state.score = _state.gauges[scoreGaugeId]
    }
  }

  function evaluateGameOver(): boolean {
    for (const gauge of config.gauges) {
      if (gauge.gameOverThreshold === undefined || gauge.gameOverCondition === undefined) continue

      const value = _state.gauges[gauge.id]
      if (value === undefined) continue

      // Uses >= / <= (not strict > / <) because gauge clamping to [0, 100]
      // makes strict inequality unreachable at boundaries (e.g., energie clamped
      // to 0 can never be < 0). Intentional deviation from story spec wording.
      const triggered =
        gauge.gameOverCondition === 'above'
          ? value >= gauge.gameOverThreshold
          : value <= gauge.gameOverThreshold

      if (triggered) {
        _state.isGameOver = true
        _state.gameOverParagraphId = gauge.gameOverParagraphId ?? null
        if (gauge.gameOverParagraphId) {
          _state.paragraphId = gauge.gameOverParagraphId
        }
        return true
      }
    }
    return false
  }

  function evaluateActTransition(paragraphId: string): void {
    for (const act of config.acts) {
      if (act.id === _state.act) continue
      if (act.paragraphIds.includes(paragraphId)) {
        _state.act = act.id
        return
      }
    }
  }

  const engine: Engine = {
    getState(): EngineState {
      return deepCopyState(_state)
    },

    resolveChoice(choiceId: string): EngineState {
      const paragraph = config.paragraphs[_state.paragraphId]
      if (!paragraph) {
        throw new EngineError(`Paragraph '${_state.paragraphId}' not found in config`)
      }

      const choice = paragraph.choices.find(c => c.id === choiceId)
      if (!choice) {
        throw new EngineError(
          `Choice '${choiceId}' not found in paragraph '${_state.paragraphId}'`
        )
      }

      // Step 1: Apply choice gauge effects
      if (choice.gaugeEffects && choice.gaugeEffects.length > 0) {
        _state.gauges = applyGaugeEffects(_state.gauges, choice.gaugeEffects, _state.stats, config)
      }

      // Step 2: Resolve weighted outcome if present
      if (choice.weightedOutcome) {
        const result = resolveOutcome(choice.weightedOutcome, _state.gauges, _state.stats, config)
        const effects = result === 'good'
          ? choice.weightedOutcome.goodEffects
          : choice.weightedOutcome.badEffects
        _state.gauges = applyGaugeEffects(_state.gauges, effects, _state.stats, config)
      }

      // Step 3: Clamp already handled by applyGaugeEffects

      // Step 4: Apply inventory changes
      if (choice.inventoryAdd) {
        for (const item of choice.inventoryAdd) {
          if (!_state.inventory.includes(item)) {
            _state.inventory.push(item)
          }
        }
      }
      if (choice.inventoryRemove) {
        _state.inventory = _state.inventory.filter(
          item => !choice.inventoryRemove!.includes(item)
        )
      }

      // Sync score after gauge changes
      syncScore()

      // Step 5: Evaluate Game Over — if triggered, STOP
      if (evaluateGameOver()) {
        return engine.getState()
      }

      // Step 6: Evaluate act transition
      evaluateActTransition(choice.targetParagraphId)

      // Step 7: Advance paragraphId
      _state.paragraphId = choice.targetParagraphId

      // Check if target paragraph is a completion paragraph
      const targetParagraph = config.paragraphs[choice.targetParagraphId]
      if (targetParagraph?.isComplete) {
        _state.isComplete = true
      }

      return engine.getState()
    },

    applyDecay(): EngineState {
      // Guard: only apply decay at designated decay nodes
      if (!config.decayNodes.includes(_state.paragraphId)) {
        return engine.getState()
      }

      // Apply decay rules
      _state.gauges = applyDecayRules(_state.gauges, config.decayRules, _state.stats, config)

      // Sync score
      syncScore()

      // Evaluate Game Over
      if (evaluateGameOver()) {
        return engine.getState()
      }

      // Evaluate act transition
      evaluateActTransition(_state.paragraphId)

      return engine.getState()
    },

    reset(): void {
      _state = freshState()
    },

    setStats(stats: Record<string, number>): void {
      _state.stats = { ...stats }
    },

    serialize(): SaveState {
      return {
        storyId: config.id,
        version: 1,
        savedAt: Date.now(),
        engineState: engine.getState(),
      }
    },
  }

  return engine
}
