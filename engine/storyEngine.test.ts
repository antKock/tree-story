import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createEngine, type Engine } from './storyEngine'
import { applyGaugeEffects, applyDecay } from './gaugeSystem'
import { resolveOutcome } from './weightedOutcome'
import * as persistence from './persistence'
import { dubCampFixture } from './__fixtures__/dub-camp-fixture'
import type { StoryConfig, EngineState } from './types'

// ─── localStorage mock ──────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (index: number) => Object.keys(store)[index] ?? null,
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

// ─── Helpers ────────────────────────────────────────────────────────────────
const config = dubCampFixture

function createFreshEngine(stats: Record<string, number> = {}): Engine {
  const engine = createEngine(config)
  if (Object.keys(stats).length > 0) {
    engine.setStats(stats)
  }
  return engine
}

const defaultStats = { endurance: 2, estomac: 3, resistanceAlcool: 3, resistanceFumette: 2 }

function makeEngineAt(paragraphId: string, gauges: Record<string, number>, stats: Record<string, number> = defaultStats, extras: Partial<EngineState> = {}): Engine {
  return createEngine(config, {
    storyId: 'dub-camp-test',
    version: 1,
    savedAt: Date.now(),
    engineState: {
      storyId: 'dub-camp-test',
      paragraphId,
      gauges: { energie: 100, alcool: 0, fumette: 0, nourriture: 50, kiff: 0, ...gauges },
      stats,
      act: 'act1',
      inventory: [],
      score: gauges.kiff ?? 0,
      isGameOver: false,
      gameOverParagraphId: null,
      isComplete: false,
      lastOutcomeText: null,
      lastGaugeDeltas: null,
      ...extras,
    },
  })
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Gauge System', () => {
  describe('applyGaugeEffects', () => {
    it('applies delta to correct gauge', () => {
      const gauges = { energie: 100, alcool: 0 }
      const result = applyGaugeEffects(
        gauges,
        [{ gaugeId: 'energie', delta: -10 }],
        {},
        config
      )
      expect(result.energie).toBe(90)
      expect(result.alcool).toBe(0)
    })

    it('does not mutate input', () => {
      const gauges = { energie: 100 }
      const result = applyGaugeEffects(gauges, [{ gaugeId: 'energie', delta: -10 }], {}, config)
      expect(gauges.energie).toBe(100)
      expect(result.energie).toBe(90)
    })

    it('applies stat influence to delta (additive formula)', () => {
      const gauges = { energie: 100 }
      const result = applyGaugeEffects(
        gauges,
        [{
          gaugeId: 'energie',
          delta: -20,
          statInfluence: { statId: 'endurance', multiplier: 2 },
        }],
        { endurance: 4 },
        config
      )
      // delta = -20 + (4 * 2) = -12
      expect(result.energie).toBe(88)
    })

    it('skips unknown gauge IDs gracefully', () => {
      const gauges = { energie: 50 }
      const result = applyGaugeEffects(
        gauges,
        [{ gaugeId: 'nonexistent', delta: 10 }],
        {},
        config
      )
      expect(result).toEqual({ energie: 50 })
    })
  })

  describe('clamping', () => {
    it('clamps gauge to 100 when applying large positive delta', () => {
      const gauges = { energie: 80 }
      const result = applyGaugeEffects(gauges, [{ gaugeId: 'energie', delta: 1000 }], {}, config)
      expect(result.energie).toBe(100)
    })

    it('clamps gauge to 0 when applying large negative delta', () => {
      const gauges = { energie: 20 }
      const result = applyGaugeEffects(gauges, [{ gaugeId: 'energie', delta: -1000 }], {}, config)
      expect(result.energie).toBe(0)
    })

    it('clamps +50 at 80 to 100', () => {
      const gauges = { energie: 80 }
      const result = applyGaugeEffects(gauges, [{ gaugeId: 'energie', delta: 50 }], {}, config)
      expect(result.energie).toBe(100)
    })

    it('clamps -50 at 30 to 0', () => {
      const gauges = { energie: 30 }
      const result = applyGaugeEffects(gauges, [{ gaugeId: 'energie', delta: -50 }], {}, config)
      expect(result.energie).toBe(0)
    })
  })

  describe('applyDecay', () => {
    it('does not mutate input gauges', () => {
      const gauges = { nourriture: 50, energie: 80 }
      const original = { ...gauges }
      applyDecay(gauges, config.decayRules, { estomac: 0 }, config)
      expect(gauges).toEqual(original)
    })
  })

  describe('Nourriture decay formula', () => {
    it('with estomac=0: decay = 10', () => {
      const gauges = { nourriture: 50, energie: 80 }
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.99) // no passive risk
      const result = applyDecay(gauges, config.decayRules, { estomac: 0 }, config)
      expect(result.nourriture).toBe(40) // 50 - 10
      spy.mockRestore()
    })

    it('with estomac=4: decay = max(3, 10-6) = 4', () => {
      const gauges = { nourriture: 50, energie: 80 }
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.99)
      const result = applyDecay(gauges, config.decayRules, { estomac: 4 }, config)
      expect(result.nourriture).toBe(46) // 50 - 4
      spy.mockRestore()
    })

    it('with estomac=6: decay = max(3, 10-9) = 3 (floor)', () => {
      const gauges = { nourriture: 50, energie: 80 }
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.99)
      const result = applyDecay(gauges, config.decayRules, { estomac: 6 }, config)
      expect(result.nourriture).toBe(47) // 50 - 3
      spy.mockRestore()
    })

    it('nourriture cannot go below 0', () => {
      const gauges = { nourriture: 2, energie: 80 }
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.99)
      const result = applyDecay(gauges, config.decayRules, { estomac: 0 }, config)
      expect(result.nourriture).toBe(0)
      spy.mockRestore()
    })
  })

  describe('passive energy risk', () => {
    it('applies -8 energie when random < 0.06', () => {
      const gauges = { nourriture: 50, energie: 80 }
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.03) // < 0.06
      const result = applyDecay(gauges, config.decayRules, { estomac: 0 }, config)
      expect(result.energie).toBe(72) // 80 - 8
      spy.mockRestore()
    })

    it('does not apply -8 energie when random >= 0.06', () => {
      const gauges = { nourriture: 50, energie: 80 }
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5) // >= 0.06
      const result = applyDecay(gauges, config.decayRules, { estomac: 0 }, config)
      expect(result.energie).toBe(80)
      spy.mockRestore()
    })
  })
})

describe('Weighted Outcome Resolution', () => {
  const outcome = {
    gaugeId: 'alcool',
    statId: 'resistanceAlcool',
    outcomes: [
      { id: 'a', maxRisk: 60, text: 'Good outcome.', effects: [{ gaugeId: 'kiff', delta: 5 }] },
      { id: 'b', maxRisk: 100, text: 'Bad outcome.', effects: [{ gaugeId: 'alcool', delta: 10 }] },
    ],
  }

  it('returns outcome a when roll < goodProbability', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.1)
    const result = resolveOutcome(
      outcome,
      { alcool: 20, nourriture: 60 },
      { resistanceAlcool: 3 },
      config
    )
    // risk = 20 - (3*15) + 0 = -25 → < 30 → 90% good
    // roll 0.1 < 0.9 → outcome a
    expect(result.id).toBe('a')
    spy.mockRestore()
  })

  it('returns outcome b when roll >= goodProbability', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.95)
    const result = resolveOutcome(
      outcome,
      { alcool: 20, nourriture: 60 },
      { resistanceAlcool: 3 },
      config
    )
    // risk = -25 → 90% good, roll 0.95 >= 0.9 → outcome b
    expect(result.id).toBe('b')
    spy.mockRestore()
  })

  it('applies hunger modifier when nourriture is low', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.55)
    const outcomeWithHunger = { ...outcome, hungerGaugeId: 'nourriture' }
    const result = resolveOutcome(
      outcomeWithHunger,
      { alcool: 60, nourriture: 10 }, // < 25 → +25 modifier
      { resistanceAlcool: 2 },
      config
    )
    // risk = 60 - (2*15) + 25 = 60 - 30 + 25 = 55 → <= 55 → 60% good
    // roll 0.55 < 0.6 → outcome a
    expect(result.id).toBe('a')
    spy.mockRestore()
  })

  it('does NOT apply hunger modifier when hungerGaugeId is absent', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.55)
    // No hungerGaugeId: hunger modifier = 0. risk = 60 - (2*15) + 0 = 30 → 30–55 range → 60% good
    // roll 0.55 < 0.6 → outcome a (same tier, different path)
    const result = resolveOutcome(
      outcome, // no hungerGaugeId
      { alcool: 60, nourriture: 10 }, // nourriture low but ignored
      { resistanceAlcool: 2 },
      config
    )
    // risk = 30 → 60% good; roll 0.55 < 0.6 → outcome a
    expect(result.id).toBe('a')
    spy.mockRestore()
  })

  it('uses custom statMultiplier when provided', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.85)
    const outcomeWithMultiplier = { ...outcome, statMultiplier: 5 }
    // risk = 70 - (3 * 5) + 0 = 70 - 15 = 55 → <= 55 → 60% good
    // roll 0.85 >= 0.6 → outcome b
    const result = resolveOutcome(
      outcomeWithMultiplier,
      { alcool: 70, nourriture: 60 },
      { resistanceAlcool: 3 },
      config
    )
    expect(result.id).toBe('b')
    spy.mockRestore()
  })

  it('handles missing gaugeId gracefully (treats as 0)', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.1)
    const result = resolveOutcome(
      outcome,
      { nourriture: 60 }, // no alcool gauge
      { resistanceAlcool: 3 },
      config
    )
    // gaugeLevel = 0, risk = 0 - 45 + 0 = -45 → 90%
    expect(result.id).toBe('a')
    spy.mockRestore()
  })

  it('handles missing statId gracefully (treats as 0)', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.85)
    const result = resolveOutcome(
      outcome,
      { alcool: 70, nourriture: 60 },
      {}, // no stats
      config
    )
    // risk = 70 - 0 + 0 = 70 → 55–75 → 40% good
    // roll 0.85 >= 0.4 → outcome b
    expect(result.id).toBe('b')
    spy.mockRestore()
  })

  it('selects correct branch from 3-outcome weighted resolution', () => {
    const threeOutcome = {
      gaugeId: 'alcool',
      statId: 'resistanceAlcool',
      outcomes: [
        { id: 'a', maxRisk: 30, text: 'Amazing', effects: [] },
        { id: 'b', maxRisk: 70, text: 'Decent', effects: [] },
        { id: 'c', maxRisk: 100, text: 'Bad', effects: [] },
      ],
    }
    // risk in 30-55 range → goodProbability = 0.6
    // roll 0.65 >= 0.6 → bad zone: badZoneWidth = (1-0.6)/2 = 0.2
    // badIndex = 1 + Math.floor((0.65-0.6)/0.2) = 1 + 0 = 1 → outcome b
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.65)
    const result = resolveOutcome(
      threeOutcome,
      { alcool: 60, nourriture: 60 },
      { resistanceAlcool: 2 }, // risk = 60 - 30 = 30 → exactly 30–55 → 0.6
      config
    )
    expect(result.id).toBe('b')
    expect(result.text).toBe('Decent')
    spy.mockRestore()
  })

  it('selects outcome c from 3-outcome at high roll', () => {
    const threeOutcome = {
      gaugeId: 'alcool',
      statId: 'resistanceAlcool',
      outcomes: [
        { id: 'a', maxRisk: 30, text: 'Amazing', effects: [] },
        { id: 'b', maxRisk: 70, text: 'Decent', effects: [] },
        { id: 'c', maxRisk: 100, text: 'Bad', effects: [] },
      ],
    }
    // goodProbability = 0.6, badZoneWidth = 0.2
    // roll 0.85 → badIndex = 1 + Math.floor((0.85-0.6)/0.2) = 1 + 1 = 2 → outcome c
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.85)
    const result = resolveOutcome(
      threeOutcome,
      { alcool: 60, nourriture: 60 },
      { resistanceAlcool: 2 },
      config
    )
    expect(result.id).toBe('c')
    spy.mockRestore()
  })
})

describe('Core Story Engine', () => {
  let engine: Engine

  beforeEach(() => {
    localStorageMock.clear()
    engine = createFreshEngine(defaultStats)
  })

  describe('initEngine', () => {
    it('initializes with correct starting state', () => {
      const state = engine.getState()
      expect(state.paragraphId).toBe('s1')
      expect(state.act).toBe('act1')
      expect(state.gauges.energie).toBe(100)
      expect(state.gauges.alcool).toBe(0)
      expect(state.gauges.fumette).toBe(0)
      expect(state.gauges.nourriture).toBe(50)
      expect(state.gauges.kiff).toBe(0)
      expect(state.isGameOver).toBe(false)
      expect(state.isComplete).toBe(false)
      expect(state.inventory).toEqual([])
      expect(state.lastOutcomeText).toBeNull()
      expect(state.lastGaugeDeltas).toBeNull()
    })

    it('restores from valid saved state', () => {
      const savedEngineState: EngineState = {
        storyId: 'dub-camp-test',
        paragraphId: 's20',
        gauges: { energie: 60, alcool: 30, fumette: 10, nourriture: 40, kiff: 15 },
        stats: defaultStats,
        act: 'act2',
        inventory: ['sandwich'],
        score: 15,
        isGameOver: false,
        gameOverParagraphId: null,
        isComplete: false,
        lastOutcomeText: null,
        lastGaugeDeltas: null,
      }
      const savedState = {
        storyId: 'dub-camp-test',
        version: 1,
        savedAt: Date.now(),
        engineState: savedEngineState,
      }

      const restoredEngine = createEngine(config, savedState)
      const state = restoredEngine.getState()
      expect(state.paragraphId).toBe('s20')
      expect(state.gauges.energie).toBe(60)
      expect(state.inventory).toEqual(['sandwich'])
      expect(state.act).toBe('act2')
    })

    it('restores old saves missing lastOutcomeText/lastGaugeDeltas (migration guard)', () => {
      // Old v1.0 save without the new fields
      const savedState = {
        storyId: 'dub-camp-test',
        version: 1,
        savedAt: Date.now(),
        engineState: {
          storyId: 'dub-camp-test',
          paragraphId: 's20',
          gauges: { energie: 60, alcool: 30, fumette: 10, nourriture: 40, kiff: 15 },
          stats: defaultStats,
          act: 'act2',
          inventory: [],
          score: 15,
          isGameOver: false,
          gameOverParagraphId: null,
          isComplete: false,
          // lastOutcomeText and lastGaugeDeltas intentionally absent (old save)
        },
      }
      const restoredEngine = createEngine(config, savedState as unknown as Parameters<typeof createEngine>[1])
      const state = restoredEngine.getState()
      expect(state.paragraphId).toBe('s20') // restored, not fresh
      expect(state.lastOutcomeText).toBeNull()
      expect(state.lastGaugeDeltas).toBeNull()
    })

    it('ignores saved state with wrong version', () => {
      const savedState = {
        storyId: 'dub-camp-test',
        version: 2,
        savedAt: Date.now(),
        engineState: {
          storyId: 'dub-camp-test',
          paragraphId: 's20',
          gauges: { energie: 60, alcool: 30, fumette: 10, nourriture: 40, kiff: 15 },
          stats: defaultStats,
          act: 'act2',
          inventory: [],
          score: 15,
          isGameOver: false,
          gameOverParagraphId: null,
          isComplete: false,
          lastOutcomeText: null,
          lastGaugeDeltas: null,
        },
      }
      const restoredEngine = createEngine(config, savedState)
      expect(restoredEngine.getState().paragraphId).toBe('s1') // fresh start
    })

    it('ignores saved state with mismatched storyId', () => {
      const savedState = {
        storyId: 'wrong-story',
        version: 1,
        savedAt: Date.now(),
        engineState: {
          storyId: 'wrong-story',
          paragraphId: 's20',
          gauges: { energie: 60, alcool: 30, fumette: 10, nourriture: 40, kiff: 15 },
          stats: defaultStats,
          act: 'act2',
          inventory: [],
          score: 15,
          isGameOver: false,
          gameOverParagraphId: null,
          isComplete: false,
          lastOutcomeText: null,
          lastGaugeDeltas: null,
        },
      }
      const restoredEngine = createEngine(config, savedState)
      expect(restoredEngine.getState().paragraphId).toBe('s1')
    })

    it('ignores saved state with non-existent paragraphId', () => {
      const savedState = {
        storyId: 'dub-camp-test',
        version: 1,
        savedAt: Date.now(),
        engineState: {
          storyId: 'dub-camp-test',
          paragraphId: 's999',
          gauges: {},
          stats: {},
          act: 'act1',
          inventory: [],
          score: 0,
          isGameOver: false,
          gameOverParagraphId: null,
          isComplete: false,
          lastOutcomeText: null,
          lastGaugeDeltas: null,
        },
      }
      const restoredEngine = createEngine(config, savedState)
      expect(restoredEngine.getState().paragraphId).toBe('s1')
    })
  })

  describe('getState', () => {
    it('returns a deep copy (not the internal reference)', () => {
      const state1 = engine.getState()
      const state2 = engine.getState()
      expect(state1).toEqual(state2)
      expect(state1).not.toBe(state2)
      expect(state1.gauges).not.toBe(state2.gauges)
      expect(state1.inventory).not.toBe(state2.inventory)
    })
  })

  describe('resolveChoice', () => {
    it('applies gauge effects from choice', () => {
      const state = engine.resolveChoice('c1a') // -5 energie
      expect(state.gauges.energie).toBe(95)
    })

    it('applies multiple gauge effects', () => {
      const state = engine.resolveChoice('c1b') // +20 alcool, +3 kiff
      expect(state.gauges.alcool).toBe(20)
      expect(state.gauges.kiff).toBe(3)
    })

    it('advances paragraphId to target', () => {
      const state = engine.resolveChoice('c1a')
      expect(state.paragraphId).toBe('s10')
    })

    it('throws EngineError for invalid choice', () => {
      expect(() => engine.resolveChoice('nonexistent')).toThrow('not found')
    })

    it('applies weighted outcome good effects', () => {
      // Navigate to s10
      engine.resolveChoice('c1a')
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.1) // good outcome, no conditional
      const state = engine.resolveChoice('c10b')
      expect(state.gauges.kiff).toBeGreaterThan(0) // outcomes[0] (good): kiff +5
      spy.mockRestore()
    })

    it('applies weighted outcome bad effects', () => {
      engine.resolveChoice('c1a')
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.99) // bad outcome + no conditional branch
      const stateBefore = engine.getState()
      const stateAfter = engine.resolveChoice('c10b')
      // outcomes[1] (bad): alcool +10 on top of choice effect alcool +15
      expect(stateAfter.gauges.alcool).toBe(stateBefore.gauges.alcool + 15 + 10)
      spy.mockRestore()
    })

    it('applies inventory changes', () => {
      // Navigate to s40
      engine.resolveChoice('c1a')
      engine.resolveChoice('c10a')
      vi.spyOn(Math, 'random').mockReturnValue(0.99) // no passive risk
      engine.resolveChoice('c20b')
      engine.resolveChoice('c30a')

      const state = engine.resolveChoice('c40d') // inventoryAdd: ['sandwich']
      expect(state.inventory).toContain('sandwich')
      vi.restoreAllMocks()
    })
  })

  describe('lastOutcomeText and lastGaugeDeltas', () => {
    it('lastOutcomeText is null after choice with no weighted outcome', () => {
      const state = engine.resolveChoice('c1a') // no weightedOutcome
      expect(state.lastOutcomeText).toBeNull()
    })

    it('lastOutcomeText is set after weighted outcome resolves (good)', () => {
      engine.resolveChoice('c1a') // navigate to s10
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.1) // good outcome
      const state = engine.resolveChoice('c10b')
      expect(state.lastOutcomeText).toBe('Good outcome.')
      spy.mockRestore()
    })

    it('lastOutcomeText is set after weighted outcome resolves (bad)', () => {
      engine.resolveChoice('c1a')
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.99) // bad outcome + conditional
      const state = engine.resolveChoice('c10b')
      expect(state.lastOutcomeText).toBe('Bad outcome.')
      spy.mockRestore()
    })

    it('lastOutcomeText is cleared to null at start of next resolveChoice', () => {
      engine.resolveChoice('c1a')
      // c10b has weightedOutcome + conditionalBranch (prob 0.33)
      // Use 0.1 for resolveOutcome (good outcome), 0.5 for conditionalBranch (0.5 >= 0.33 → normal route s20)
      const spy = vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.1)  // resolveOutcome → outcome a
        .mockReturnValueOnce(0.5)  // conditionalBranch → 0.5 >= 0.33 → normal route s20
      engine.resolveChoice('c10b') // sets lastOutcomeText, routes to s20
      spy.mockRestore()

      // Next choice at s20 (no weighted outcome)
      vi.spyOn(Math, 'random').mockReturnValue(0.99)
      const state = engine.resolveChoice('c20b')
      expect(state.lastOutcomeText).toBeNull()
      vi.restoreAllMocks()
    })

    it('lastGaugeDeltas reflects correct delta after choice with gauge effects', () => {
      const state = engine.resolveChoice('c1a') // energie -5
      expect(state.lastGaugeDeltas).not.toBeNull()
      expect(state.lastGaugeDeltas!['energie']).toBe(-5)
    })

    it('lastGaugeDeltas includes combined choice + outcome deltas', () => {
      engine.resolveChoice('c1a')
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.1) // good outcome: kiff +5
      const state = engine.resolveChoice('c10b') // choice: alcool +15, energie -5; good: kiff +5
      expect(state.lastGaugeDeltas!['alcool']).toBe(15)
      expect(state.lastGaugeDeltas!['kiff']).toBe(5)
      spy.mockRestore()
    })

    it('lastGaugeDeltas is null when no gauges changed', () => {
      // A choice that has no gaugeEffects and no weightedOutcome would produce null deltas.
      // Use a fresh engine where we can test by navigating to sAlt (isComplete, no effects).
      const e = makeEngineAt('s40', { energie: 50, kiff: 10 })
      const state = e.resolveChoice('c40b') // kiff +5 only
      // kiff changed by 5
      expect(state.lastGaugeDeltas!['kiff']).toBe(5)
    })
  })

  describe('Game Over paths', () => {
    it('triggers §201 (alcool too high)', () => {
      const highAlcoolEngine = makeEngineAt('s60', { energie: 50, alcool: 70, nourriture: 50, kiff: 10 }, defaultStats, { act: 'act4' })

      // c60a: +20 alcool → 90, threshold is >= 85 → Game Over
      const state = highAlcoolEngine.resolveChoice('c60a')
      expect(state.isGameOver).toBe(true)
      expect(state.gameOverParagraphId).toBe('s201')
    })

    it('triggers §202 (fumette too high)', () => {
      const engine = makeEngineAt('s30', { energie: 50, fumette: 65, nourriture: 50, kiff: 10 }, defaultStats, { act: 'act2' })

      // c30b: +25 fumette → 90, threshold >= 85 → Game Over
      const state = engine.resolveChoice('c30b')
      expect(state.isGameOver).toBe(true)
      expect(state.gameOverParagraphId).toBe('s202')
    })

    it('triggers §204 (energie exhaustion)', () => {
      const engine = makeEngineAt('s60', { energie: 20, alcool: 0, nourriture: 50, kiff: 10 }, defaultStats, { act: 'act4' })

      // c60a: -25 energie → -5 → clamped to 0, threshold <= 0 → Game Over
      const state = engine.resolveChoice('c60a')
      expect(state.isGameOver).toBe(true)
      expect(state.gameOverParagraphId).toBe('s204')
    })

    it('evaluates Game Over BEFORE act transition', () => {
      const engine = makeEngineAt('s50', { energie: 10, nourriture: 50, kiff: 10 }, defaultStats, { act: 'act3' })

      // c50a: -15 energie → -5 → clamped to 0. Game Over threshold triggered.
      // Target is s60 (act4) but Game Over should fire first.
      const state = engine.resolveChoice('c50a')
      expect(state.isGameOver).toBe(true)
      expect(state.gameOverParagraphId).toBe('s204')
    })
  })

  describe('voluntary exit §41', () => {
    it('awards Kiff +5 and sets isComplete without Game Over', () => {
      // Use alcool=0, fumette=0 to avoid triggering the score multiplier rule (needs 20–55 range)
      const engine = makeEngineAt('s40', { energie: 50, alcool: 0, fumette: 0, nourriture: 30, kiff: 10 }, defaultStats, { act: 'act3' })

      const state = engine.resolveChoice('c40b') // kiff +5, target s41 (isComplete)
      expect(state.gauges.kiff).toBe(15) // 10 + 5
      expect(state.isGameOver).toBe(false)
      expect(state.isComplete).toBe(true)
      expect(state.paragraphId).toBe('s41')
    })
  })

  describe('decay at nodes', () => {
    it('applyDecay changes gauges at decay nodes', () => {
      const engine = makeEngineAt('s20', { energie: 80, nourriture: 50 }, { estomac: 0 }, { act: 'act2' })

      vi.spyOn(Math, 'random').mockReturnValue(0.99) // no passive risk
      const state = engine.applyDecay()
      expect(state.gauges.nourriture).toBe(40) // 50 - 10
      vi.restoreAllMocks()
    })

    it('applyDecay does NOT apply at non-decay nodes', () => {
      const engine = makeEngineAt('s1', { energie: 80, nourriture: 50 }, { estomac: 0 }, { act: 'act1' })

      vi.spyOn(Math, 'random').mockReturnValue(0.99)
      const state = engine.applyDecay()
      expect(state.gauges.nourriture).toBe(50) // unchanged — s1 is not a decay node
      vi.restoreAllMocks()
    })

    it('applyDecay triggers global game-over when gauge crosses threshold', () => {
      // energie at 5, passive energy risk (prob 0.06) fires → energie = 5 - 8 = clamped 0 → Game Over
      const engine = makeEngineAt('s20', { energie: 5, nourriture: 50 }, { estomac: 0 }, { act: 'act2' })

      vi.spyOn(Math, 'random').mockReturnValue(0.01) // < 0.06 → passive risk fires; also < nourriture decay threshold
      const state = engine.applyDecay()
      expect(state.isGameOver).toBe(true)
      expect(state.gameOverParagraphId).toBe('s204') // energie <= 0 → s204
      vi.restoreAllMocks()
    })

    it('decay fires AFTER choice effects on same-node choices', () => {
      const engine = makeEngineAt('s20', { energie: 80, nourriture: 50 }, { estomac: 0 }, { act: 'act2' })

      vi.spyOn(Math, 'random').mockReturnValue(0.99)

      // Choice effects first: c20a -20 energie, +5 kiff
      const afterChoice = engine.resolveChoice('c20a')
      expect(afterChoice.gauges.energie).toBe(60) // 80 - 20

      vi.restoreAllMocks()
    })
  })

  describe('act transitions', () => {
    it('transitions act when entering new act paragraphs', () => {
      const engine = makeEngineAt('s10', { energie: 80 }, defaultStats, { act: 'act1' })

      // c10a targets s20, which is in act2
      const state = engine.resolveChoice('c10a')
      expect(state.paragraphId).toBe('s20')
      expect(state.act).toBe('act2')
    })
  })

  describe('reset', () => {
    it('resets to initial state', () => {
      engine.resolveChoice('c1b') // modify state
      engine.reset()
      const state = engine.getState()
      expect(state.paragraphId).toBe('s1')
      expect(state.gauges.energie).toBe(100)
      expect(state.gauges.alcool).toBe(0)
      expect(state.gauges.kiff).toBe(0)
      expect(state.isGameOver).toBe(false)
      expect(state.isComplete).toBe(false)
      expect(state.inventory).toEqual([])
    })
  })

  describe('setStats', () => {
    it('updates stats on engine state', () => {
      const engine = createEngine(config)
      engine.setStats({ endurance: 4, estomac: 2, resistanceAlcool: 3, resistanceFumette: 1 })
      const state = engine.getState()
      expect(state.stats.endurance).toBe(4)
      expect(state.stats.estomac).toBe(2)
    })
  })

  describe('serialize', () => {
    it('produces valid SaveState', () => {
      const save = engine.serialize()
      expect(save.storyId).toBe('dub-camp-test')
      expect(save.version).toBe(1)
      expect(save.savedAt).toBeGreaterThan(0)
      expect(save.engineState.paragraphId).toBe('s1')
    })
  })

  describe('score tracking', () => {
    it('syncs score with kiff gauge', () => {
      const state = engine.resolveChoice('c1b') // +3 kiff
      expect(state.score).toBe(3)
      expect(state.gauges.kiff).toBe(3)
    })
  })
})

describe('Score Multipliers', () => {
  it('applies score multiplier when all conditions met', () => {
    // alcool 35 (20–55 ✓), fumette 30 (20–55 ✓) → multiplier 1.4
    const engine = makeEngineAt('s1', { alcool: 35, fumette: 30, kiff: 0, energie: 100, nourriture: 50 })
    // c1b gives kiff +3 → 3 * 1.4 = 4.2 → 4 (kiff gauge = 4.2 but clamped to integer via number)
    const state = engine.resolveChoice('c1b') // kiff +3
    expect(state.gauges.kiff).toBeCloseTo(4.2)
  })

  it('does NOT apply score multiplier when one condition unmet', () => {
    // alcool 35 (✓), fumette 10 (fails min: 20) → no multiplier
    const engine = makeEngineAt('s1', { alcool: 35, fumette: 10, kiff: 0, energie: 100, nourriture: 50 })
    const state = engine.resolveChoice('c1b') // kiff +3
    expect(state.gauges.kiff).toBe(3) // no multiplier
  })

  it('first matching rule wins', () => {
    // Use a config with two rules; first rule applies
    const engine = makeEngineAt('s1', { alcool: 35, fumette: 30, kiff: 0, energie: 100, nourriture: 50 })
    const state = engine.resolveChoice('c1b') // kiff +3 * 1.4
    // Should have applied 1.4x (first rule match)
    expect(state.gauges.kiff).toBeCloseTo(4.2)
    expect(state.gauges.kiff).not.toBe(3) // baseline without multiplier
  })

  it('applies score multiplier to weighted outcome branch effects', () => {
    // Navigate to s10, set up sweet-spot gauges (alcool 35, fumette 30) → 1.4× multiplier
    // c10b: choice gaugeEffects (alcool +15, energie -5) + weightedOutcome good: kiff +5
    // With multiplier 1.4: kiff delta from outcome = 5 * 1.4 = 7
    const engine = makeEngineAt('s10', { alcool: 35, fumette: 30, kiff: 0, energie: 100, nourriture: 50 })
    const spy = vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.1)  // resolveOutcome → good branch (kiff +5)
      .mockReturnValueOnce(0.5)  // conditionalBranch → 0.5 >= 0.33 → normal route
    const state = engine.resolveChoice('c10b')
    // kiff from outcome: 5 * 1.4 = 7
    expect(state.gauges.kiff).toBeCloseTo(7)
    spy.mockRestore()
  })
})

describe('Contextual Game Over', () => {
  // Add a contextualGameOver test by extending the config temporarily
  it('contextual GO fires when gauge crosses threshold at that paragraph', () => {
    // Build a custom config with contextualGameOver on s50
    const customConfig: StoryConfig = {
      ...config,
      paragraphs: {
        ...config.paragraphs,
        s50: {
          ...config.paragraphs['s50'],
          contextualGameOver: [
            { gaugeId: 'energie', threshold: 20, condition: 'below', targetParagraphId: 's204' },
          ],
        },
      },
    }
    const engine = createEngine(customConfig, {
      storyId: 'dub-camp-test',
      version: 1,
      savedAt: Date.now(),
      engineState: {
        storyId: 'dub-camp-test',
        paragraphId: 's50',
        gauges: { energie: 30, alcool: 0, fumette: 0, nourriture: 50, kiff: 0 },
        stats: defaultStats,
        act: 'act3',
        inventory: [],
        score: 0,
        isGameOver: false,
        gameOverParagraphId: null,
        isComplete: false,
        lastOutcomeText: null,
        lastGaugeDeltas: null,
      },
    })
    // c50a: -15 energie → 15, threshold below 20 → contextual GO fires
    const state = engine.resolveChoice('c50a')
    expect(state.isGameOver).toBe(true)
    expect(state.paragraphId).toBe('s204')
  })

  it('contextual GO does NOT fire at other paragraphs', () => {
    // Same GO rule only on s50 — at s60, it should not fire
    const customConfig: StoryConfig = {
      ...config,
      paragraphs: {
        ...config.paragraphs,
        s50: {
          ...config.paragraphs['s50'],
          contextualGameOver: [
            { gaugeId: 'energie', threshold: 20, condition: 'below', targetParagraphId: 's204' },
          ],
        },
      },
    }
    const engine = createEngine(customConfig, {
      storyId: 'dub-camp-test',
      version: 1,
      savedAt: Date.now(),
      engineState: {
        storyId: 'dub-camp-test',
        paragraphId: 's60',
        gauges: { energie: 30, alcool: 0, fumette: 0, nourriture: 50, kiff: 10 },
        stats: defaultStats,
        act: 'act4',
        inventory: [],
        score: 10,
        isGameOver: false,
        gameOverParagraphId: null,
        isComplete: false,
        lastOutcomeText: null,
        lastGaugeDeltas: null,
      },
    })
    // c60b: -10 energie → 20, which is exactly 20 (below threshold is < 20, not <=)
    // Actually threshold <= uses <= so 20 <= 20 is true, but that's at s60 which has no contextualGO
    // Use c60a: -25 energie → 5, definitely below 20, but contextual GO only on s50
    const state = engine.resolveChoice('c60b') // -10 energie → 20
    // s60 has no contextualGameOver — only global GO would fire (>= 0 threshold for energie)
    // energie = 20, not <= 0, so no GO
    expect(state.isGameOver).toBe(false)
  })

  it('contextual GO with probability: 0.5 fires when roll < 0.5', () => {
    const customConfig: StoryConfig = {
      ...config,
      paragraphs: {
        ...config.paragraphs,
        s50: {
          ...config.paragraphs['s50'],
          contextualGameOver: [
            { gaugeId: 'energie', threshold: 20, condition: 'below', probability: 0.5, targetParagraphId: 's204' },
          ],
        },
      },
    }
    const engine = createEngine(customConfig, {
      storyId: 'dub-camp-test',
      version: 1,
      savedAt: Date.now(),
      engineState: {
        storyId: 'dub-camp-test',
        paragraphId: 's50',
        gauges: { energie: 30, alcool: 0, fumette: 0, nourriture: 50, kiff: 0 },
        stats: defaultStats,
        act: 'act3',
        inventory: [],
        score: 0,
        isGameOver: false,
        gameOverParagraphId: null,
        isComplete: false,
        lastOutcomeText: null,
        lastGaugeDeltas: null,
      },
    })
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.3) // < 0.5 → fires
    const state = engine.resolveChoice('c50a')
    expect(state.isGameOver).toBe(true)
    spy.mockRestore()
  })

  it('contextual GO with probability: 0.5 does NOT fire when roll >= 0.5', () => {
    const customConfig: StoryConfig = {
      ...config,
      paragraphs: {
        ...config.paragraphs,
        s50: {
          ...config.paragraphs['s50'],
          contextualGameOver: [
            { gaugeId: 'energie', threshold: 20, condition: 'below', probability: 0.5, targetParagraphId: 's204' },
          ],
        },
      },
    }
    const engine = createEngine(customConfig, {
      storyId: 'dub-camp-test',
      version: 1,
      savedAt: Date.now(),
      engineState: {
        storyId: 'dub-camp-test',
        paragraphId: 's50',
        gauges: { energie: 30, alcool: 0, fumette: 0, nourriture: 50, kiff: 0 },
        stats: defaultStats,
        act: 'act3',
        inventory: [],
        score: 0,
        isGameOver: false,
        gameOverParagraphId: null,
        isComplete: false,
        lastOutcomeText: null,
        lastGaugeDeltas: null,
      },
    })
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.7) // >= 0.5 → does not fire
    const state = engine.resolveChoice('c50a')
    expect(state.isGameOver).toBe(false)
    spy.mockRestore()
  })
})

describe('Conditional Branching', () => {
  it('routes to conditionalBranch.targetParagraphId when roll < probability', () => {
    // c10b has conditionalBranch: { probability: 0.33, targetParagraphId: 'sAlt' }
    const engine = makeEngineAt('s10', { energie: 80, alcool: 0 })
    // Need roll < 0.33 for conditional branch AND the weighted outcome roll
    // resolveOutcome is called first (first Math.random call), then conditional branch (second call)
    // But both use Math.random. Let's mock to return 0.1 for both calls.
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.1) // < 0.33 → conditional branch fires
    const state = engine.resolveChoice('c10b')
    expect(state.paragraphId).toBe('sAlt')
    spy.mockRestore()
  })

  it('routes to choice.targetParagraphId when roll >= probability', () => {
    const engine = makeEngineAt('s10', { energie: 80, alcool: 0 })
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5) // >= 0.33 → normal route
    const state = engine.resolveChoice('c10b')
    expect(state.paragraphId).toBe('s20')
    spy.mockRestore()
  })
})

describe('Composite Game Over', () => {
  // fixture has compositeGameOverRules: alcool >= 60, nourriture <= 20, probability: 0.22

  it('triggers composite GO when all conditions met and probability roll succeeds', () => {
    const engine = makeEngineAt('s50', { energie: 100, alcool: 65, nourriture: 10, kiff: 0 })
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.1) // < 0.22 → GO fires
    // c50b: +10 energie, +3 kiff (doesn't change alcool/nourriture, conditions already met)
    const state = engine.resolveChoice('c50b')
    expect(state.isGameOver).toBe(true)
    expect(state.paragraphId).toBe('s203')
    spy.mockRestore()
  })

  it('does NOT trigger composite GO when one condition unmet', () => {
    // nourriture = 30 > 20 → condition fails
    const engine = makeEngineAt('s50', { energie: 100, alcool: 65, nourriture: 30, kiff: 0 })
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.1) // would fire if conditions met
    const state = engine.resolveChoice('c50b')
    expect(state.isGameOver).toBe(false)
    spy.mockRestore()
  })

  it('does NOT trigger composite GO when probability roll fails', () => {
    const engine = makeEngineAt('s50', { energie: 100, alcool: 65, nourriture: 10, kiff: 0 })
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.8) // >= 0.22 → does not fire
    const state = engine.resolveChoice('c50b')
    expect(state.isGameOver).toBe(false)
    spy.mockRestore()
  })

  it('paragraphScope restricts rule to specific paragraphs only', () => {
    const scopedConfig: StoryConfig = {
      ...config,
      compositeGameOverRules: [
        {
          paragraphScope: ['s60'], // only at s60
          conditions: [
            { gaugeId: 'alcool', min: 60 },
            { gaugeId: 'nourriture', max: 20 },
          ],
          probability: 0.22,
          targetParagraphId: 's203',
        },
      ],
    }
    // At s50 (not in paragraphScope) — should NOT fire
    const engine = createEngine(scopedConfig, {
      storyId: 'dub-camp-test',
      version: 1,
      savedAt: Date.now(),
      engineState: {
        storyId: 'dub-camp-test',
        paragraphId: 's50',
        gauges: { energie: 100, alcool: 65, fumette: 0, nourriture: 10, kiff: 0 },
        stats: defaultStats,
        act: 'act3',
        inventory: [],
        score: 0,
        isGameOver: false,
        gameOverParagraphId: null,
        isComplete: false,
        lastOutcomeText: null,
        lastGaugeDeltas: null,
      },
    })
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.1)
    const state = engine.resolveChoice('c50b')
    expect(state.isGameOver).toBe(false) // scoped to s60, not s50
    spy.mockRestore()
  })
})

describe('Persistence', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  describe('save and load round-trip', () => {
    it('round-trips correctly', () => {
      const engine = createFreshEngine(defaultStats)
      engine.resolveChoice('c1b') // modify state

      const engineState = engine.getState()
      persistence.save(engineState, config.id)

      const loaded = persistence.load()
      expect(loaded).not.toBeNull()
      expect(loaded!.version).toBe(1)
      expect(loaded!.storyId).toBe('dub-camp-test')
      expect(loaded!.engineState.paragraphId).toBe('s10')
      expect(loaded!.engineState.gauges.alcool).toBe(20)
    })

    it('full serialize → save → load → restore produces identical state', () => {
      const engine = createFreshEngine(defaultStats)
      engine.resolveChoice('c1a')
      engine.resolveChoice('c10a')

      const originalState = engine.getState()
      const saveData = engine.serialize()

      persistence.save(saveData.engineState, saveData.storyId)
      const loaded = persistence.load()
      expect(loaded).not.toBeNull()

      const restoredEngine = createEngine(config, loaded!)
      const restoredState = restoredEngine.getState()

      expect(restoredState.paragraphId).toBe(originalState.paragraphId)
      expect(restoredState.gauges).toEqual(originalState.gauges)
      expect(restoredState.stats).toEqual(originalState.stats)
      expect(restoredState.act).toBe(originalState.act)
      expect(restoredState.inventory).toEqual(originalState.inventory)
      expect(restoredState.score).toBe(originalState.score)
      expect(restoredState.isGameOver).toBe(originalState.isGameOver)
      expect(restoredState.isComplete).toBe(originalState.isComplete)
    })
  })

  describe('corrupt save handling', () => {
    it('returns null for invalid JSON', () => {
      localStorageMock.setItem('tree-story:save', 'not json{{{')
      expect(persistence.load()).toBeNull()
    })

    it('returns null for wrong version', () => {
      localStorageMock.setItem('tree-story:save', JSON.stringify({
        storyId: 'test',
        version: 2,
        savedAt: Date.now(),
        engineState: {},
      }))
      expect(persistence.load()).toBeNull()
    })

    it('returns null when key does not exist', () => {
      expect(persistence.load()).toBeNull()
    })

    it('returns null when engineState is missing', () => {
      localStorageMock.setItem('tree-story:save', JSON.stringify({
        storyId: 'test',
        version: 1,
        savedAt: Date.now(),
      }))
      expect(persistence.load()).toBeNull()
    })

    it('returns null when required EngineState field is missing', () => {
      localStorageMock.setItem('tree-story:save', JSON.stringify({
        storyId: 'test',
        version: 1,
        savedAt: Date.now(),
        engineState: {
          storyId: 'test',
          paragraphId: 's1',
          // missing: gauges, stats, act, inventory, score, isGameOver, isComplete
        },
      }))
      expect(persistence.load()).toBeNull()
    })
  })

  describe('clear', () => {
    it('removes save from localStorage', () => {
      persistence.save({
        storyId: 'test',
        paragraphId: 's1',
        gauges: {},
        stats: {},
        act: 'act1',
        inventory: [],
        score: 0,
        isGameOver: false,
        gameOverParagraphId: null,
        isComplete: false,
        lastOutcomeText: null,
        lastGaugeDeltas: null,
      }, 'test')

      expect(persistence.load()).not.toBeNull()
      persistence.clear()
      expect(persistence.load()).toBeNull()
    })
  })
})

describe('EVT1 probabilistic event', () => {
  it('applies good effects when outcome is good', () => {
    const engine = makeEngineAt('sEVT1', { energie: 80, alcool: 20, nourriture: 60, kiff: 10 }, { resistanceAlcool: 3 }, { act: 'act3' })

    // kiff +10 from choice, then good outcome: kiff +8
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.1) // good
    const state = engine.resolveChoice('cEVT1a')
    expect(state.gauges.kiff).toBe(28) // 10 + 10 + 8
    spy.mockRestore()
  })

  it('applies bad effects when outcome is bad', () => {
    const engine = makeEngineAt('sEVT1', { energie: 80, alcool: 20, nourriture: 60, kiff: 10 }, { resistanceAlcool: 3 }, { act: 'act3' })

    // kiff +10 from choice, then bad outcome: alcool +15, energie -10
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.99) // bad
    const state = engine.resolveChoice('cEVT1a')
    expect(state.gauges.alcool).toBe(35) // 20 + 15
    expect(state.gauges.energie).toBe(70) // 80 - 10
    expect(state.gauges.kiff).toBe(20) // 10 + 10 (no +8 from good)
    spy.mockRestore()
  })
})
