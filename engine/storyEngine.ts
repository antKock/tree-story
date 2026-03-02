// Pure engine module — zero imports from components/, hooks/, or app/
import type { StoryConfig, EngineState, SaveState, GaugeCondition } from './types'
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
    lastGaugeDeltas: state.lastGaugeDeltas ? { ...state.lastGaugeDeltas } : null,
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
      lastOutcomeText: null,
      lastGaugeDeltas: null,
    }
  }

  if (savedState && isValidSavedState(savedState, config)) {
    _state = deepCopyState(savedState.engineState)
    // Ensure new fields exist for old saves
    if (_state.lastOutcomeText === undefined) _state.lastOutcomeText = null
    if (_state.lastGaugeDeltas === undefined) _state.lastGaugeDeltas = null
  } else {
    _state = freshState()
  }

  function syncScore(): void {
    if (scoreGaugeId && scoreGaugeId in _state.gauges) {
      _state.score = _state.gauges[scoreGaugeId]
    }
  }

  function checkGaugeCondition(gaugeValue: number, condition: GaugeCondition): boolean {
    if (condition.min !== undefined && gaugeValue < condition.min) return false
    if (condition.max !== undefined && gaugeValue > condition.max) return false
    return true
  }

  function evaluateGameOver(): boolean {
    for (const gauge of config.gauges) {
      if (gauge.gameOverThreshold === undefined || gauge.gameOverCondition === undefined) continue

      const value = _state.gauges[gauge.id]
      if (value === undefined) continue

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

  function evaluateContextualGameOver(paragraphId: string): boolean {
    const paragraph = config.paragraphs[paragraphId]
    if (!paragraph?.contextualGameOver) return false

    for (const rule of paragraph.contextualGameOver) {
      const value = _state.gauges[rule.gaugeId]
      if (value === undefined) continue

      const conditionMet =
        rule.condition === 'above'
          ? value >= rule.threshold
          : value <= rule.threshold

      if (!conditionMet) continue

      if (rule.probability !== undefined && Math.random() >= rule.probability) continue

      _state.isGameOver = true
      _state.gameOverParagraphId = rule.targetParagraphId
      _state.paragraphId = rule.targetParagraphId
      return true
    }
    return false
  }

  function evaluateCompositeGameOverRules(paragraphId: string): boolean {
    if (!config.compositeGameOverRules) return false

    for (const rule of config.compositeGameOverRules) {
      if (rule.paragraphScope && !rule.paragraphScope.includes(paragraphId)) continue

      const allConditionsMet = rule.conditions.every(cond => {
        const value = _state.gauges[cond.gaugeId]
        if (value === undefined) return false
        return checkGaugeCondition(value, cond)
      })

      if (!allConditionsMet) continue

      if (rule.probability !== undefined && Math.random() >= rule.probability) continue

      _state.isGameOver = true
      _state.gameOverParagraphId = rule.targetParagraphId
      _state.paragraphId = rule.targetParagraphId
      return true
    }
    return false
  }

  function applyScoreMultiplier(delta: number, preChoiceGauges: Record<string, number>): number {
    if (!config.scoreMultipliers) return delta

    for (const rule of config.scoreMultipliers) {
      const allMet = rule.conditions.every(cond => {
        const value = preChoiceGauges[cond.gaugeId]
        if (value === undefined) return false
        return checkGaugeCondition(value, cond)
      })
      if (allMet) return delta * rule.multiplier
    }
    return delta
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

      // Step 0: Clear outcome text and deltas from previous choice
      _state.lastOutcomeText = null
      _state.lastGaugeDeltas = null

      // Step 1: Snapshot pre-choice gauge values for delta computation and score multiplier evaluation
      const prevGauges = { ..._state.gauges }

      // Step 2: Apply choice.gaugeEffects (with score multiplier applied to score gauge delta)
      if (choice.gaugeEffects && choice.gaugeEffects.length > 0) {
        const modifiedEffects = choice.gaugeEffects.map(effect => {
          if (scoreGaugeId && effect.gaugeId === scoreGaugeId && effect.delta !== 0) {
            return { ...effect, delta: applyScoreMultiplier(effect.delta, prevGauges) }
          }
          return effect
        })
        _state.gauges = applyGaugeEffects(_state.gauges, modifiedEffects, _state.stats, config)
      }

      // Step 3: Resolve choice.weightedOutcome → apply branch.effects (with score multiplier)
      if (choice.weightedOutcome) {
        const branch = resolveOutcome(choice.weightedOutcome, _state.gauges, _state.stats, config)
        _state.lastOutcomeText = branch.text

        const modifiedEffects = branch.effects.map(effect => {
          if (scoreGaugeId && effect.gaugeId === scoreGaugeId && effect.delta !== 0) {
            return { ...effect, delta: applyScoreMultiplier(effect.delta, prevGauges) }
          }
          return effect
        })
        _state.gauges = applyGaugeEffects(_state.gauges, modifiedEffects, _state.stats, config)
      }

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

      // Step 5: Clamp already handled by applyGaugeEffects

      // Step 6: Compute lastGaugeDeltas (diff prevGauges vs current after clamping)
      const deltas: Record<string, number> = {}
      for (const gaugeId of Object.keys(prevGauges)) {
        const delta = (_state.gauges[gaugeId] ?? 0) - prevGauges[gaugeId]
        if (delta !== 0) deltas[gaugeId] = delta
      }
      _state.lastGaugeDeltas = Object.keys(deltas).length > 0 ? deltas : null

      // Sync score after gauge changes
      syncScore()

      // Step 7: Evaluate contextualGameOver on the DEPARTURE paragraph (the one the choice was made
      // from, not the target). This allows "if you drink here and alcool is too high → game over"
      // rules scoped to specific departure points.
      if (evaluateContextualGameOver(_state.paragraphId)) {
        return engine.getState()
      }

      // Step 8: Evaluate global gameOver thresholds → if triggered: STOP
      if (evaluateGameOver()) {
        return engine.getState()
      }

      // Step 9: Evaluate compositeGameOverRules → if triggered: STOP
      if (evaluateCompositeGameOverRules(_state.paragraphId)) {
        return engine.getState()
      }

      // Step 10: Evaluate conditionalBranch → override targetId if roll succeeds
      let targetId = choice.targetParagraphId
      if (choice.conditionalBranch && Math.random() < choice.conditionalBranch.probability) {
        targetId = choice.conditionalBranch.targetParagraphId
      }

      // Step 11: Evaluate act transition
      evaluateActTransition(targetId)

      // Step 12: Advance paragraphId
      _state.paragraphId = targetId

      // Step 13: Check isComplete
      const targetParagraph = config.paragraphs[targetId]
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

      // Evaluate all game-over systems — decay can push any gauge past any threshold
      if (evaluateContextualGameOver(_state.paragraphId)) {
        return engine.getState()
      }
      if (evaluateGameOver()) {
        return engine.getState()
      }
      if (evaluateCompositeGameOverRules(_state.paragraphId)) {
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
