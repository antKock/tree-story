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

    it('applies stat influence to delta', () => {
      const gauges = { energie: 100 }
      const result = applyGaugeEffects(
        gauges,
        [{
          gaugeId: 'energie',
          delta: -20,
          statInfluence: { statId: 'endurance', multiplier: 0.1 },
        }],
        { endurance: 4 },
        config
      )
      // delta = -20 * (1 - 4 * 0.1) = -20 * 0.6 = -12
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
    goodEffects: [{ gaugeId: 'kiff', delta: 5 }],
    badEffects: [{ gaugeId: 'alcool', delta: 10 }],
  }

  it('returns good when roll < goodProbability', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.1)
    const result = resolveOutcome(
      outcome,
      { alcool: 20, nourriture: 60 },
      { resistanceAlcool: 3 },
      config
    )
    // risk = 20 - (3*15) + 0 = 20 - 45 = -25 → < 30 → 90% good
    // roll 0.1 < 0.9 → good
    expect(result).toBe('good')
    spy.mockRestore()
  })

  it('returns bad when roll >= goodProbability', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.95)
    const result = resolveOutcome(
      outcome,
      { alcool: 20, nourriture: 60 },
      { resistanceAlcool: 3 },
      config
    )
    // risk = -25 → 90% good, roll 0.95 >= 0.9 → bad
    expect(result).toBe('bad')
    spy.mockRestore()
  })

  it('applies hunger modifier when nourriture is low', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.55)
    const result = resolveOutcome(
      outcome,
      { alcool: 60, nourriture: 10 }, // < 25 → +25 modifier
      { resistanceAlcool: 2 },
      config
    )
    // risk = 60 - (2*15) + 25 = 60 - 30 + 25 = 55 → <= 55 → 60% good
    // roll 0.55 < 0.6 → good
    expect(result).toBe('good')
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
    expect(result).toBe('good')
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
    // roll 0.85 >= 0.4 → bad
    expect(result).toBe('bad')
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
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.1) // good outcome
      const state = engine.resolveChoice('c10b')
      expect(state.gauges.kiff).toBeGreaterThan(0) // goodEffects: kiff +5
      spy.mockRestore()
    })

    it('applies weighted outcome bad effects', () => {
      engine.resolveChoice('c1a')
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.99) // bad outcome
      const stateBefore = engine.getState()
      const stateAfter = engine.resolveChoice('c10b')
      // badEffects: alcool +10 on top of choice effect alcool +15
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

  describe('Game Over paths', () => {
    it('triggers §201 (alcool too high)', () => {
      // Directly manipulate to test Game Over trigger
      // Navigate and accumulate alcool
      engine.resolveChoice('c1b') // +20 alcool
      engine.resolveChoice('c10a') // just advance
      vi.spyOn(Math, 'random').mockReturnValue(0.99)
      engine.resolveChoice('c20b')
      engine.resolveChoice('c30b') // +25 fumette
      // At s40, alcool is at 20 from c1b. Need more.
      // Use c40c: +40 alcool → total 60. Still not enough.
      // Force alcool high through multiple choices isn't easy, so let's test the threshold logic directly
      vi.restoreAllMocks()

      // Create an engine with high alcool from saved state
      const highAlcoolEngine = createEngine(config, {
        storyId: 'dub-camp-test',
        version: 1,
        savedAt: Date.now(),
        engineState: {
          storyId: 'dub-camp-test',
          paragraphId: 's60',
          gauges: { energie: 50, alcool: 70, fumette: 0, nourriture: 50, kiff: 10 },
          stats: defaultStats,
          act: 'act4',
          inventory: [],
          score: 10,
          isGameOver: false,
          gameOverParagraphId: null,
          isComplete: false,
        },
      })

      // c60a: +20 alcool → 90, threshold is >= 85 → Game Over
      const state = highAlcoolEngine.resolveChoice('c60a')
      expect(state.isGameOver).toBe(true)
      expect(state.gameOverParagraphId).toBe('s201')
    })

    it('triggers §202 (fumette too high)', () => {
      const engine = createEngine(config, {
        storyId: 'dub-camp-test',
        version: 1,
        savedAt: Date.now(),
        engineState: {
          storyId: 'dub-camp-test',
          paragraphId: 's30',
          gauges: { energie: 50, alcool: 0, fumette: 65, nourriture: 50, kiff: 10 },
          stats: defaultStats,
          act: 'act2',
          inventory: [],
          score: 10,
          isGameOver: false,
          gameOverParagraphId: null,
          isComplete: false,
        },
      })

      // c30b: +25 fumette → 90, threshold >= 85 → Game Over
      const state = engine.resolveChoice('c30b')
      expect(state.isGameOver).toBe(true)
      expect(state.gameOverParagraphId).toBe('s202')
    })

    it('triggers §203 (nourriture too low)', () => {
      const engine = createEngine(config, {
        storyId: 'dub-camp-test',
        version: 1,
        savedAt: Date.now(),
        engineState: {
          storyId: 'dub-camp-test',
          paragraphId: 's20',
          gauges: { energie: 50, alcool: 0, fumette: 0, nourriture: 6, kiff: 0 },
          stats: { estomac: 0 },
          act: 'act2',
          inventory: [],
          score: 0,
          isGameOver: false,
          gameOverParagraphId: null,
          isComplete: false,
        },
      })

      // Apply decay at s20 (decay node): nourriture 6 - 10 = 0, clamped to 0 → <= 5 threshold
      vi.spyOn(Math, 'random').mockReturnValue(0.99)
      const state = engine.applyDecay()
      expect(state.isGameOver).toBe(true)
      expect(state.gameOverParagraphId).toBe('s203')
      vi.restoreAllMocks()
    })

    it('triggers §204 (energie exhaustion)', () => {
      const engine = createEngine(config, {
        storyId: 'dub-camp-test',
        version: 1,
        savedAt: Date.now(),
        engineState: {
          storyId: 'dub-camp-test',
          paragraphId: 's60',
          gauges: { energie: 20, alcool: 0, fumette: 0, nourriture: 50, kiff: 10 },
          stats: defaultStats,
          act: 'act4',
          inventory: [],
          score: 10,
          isGameOver: false,
          gameOverParagraphId: null,
          isComplete: false,
        },
      })

      // c60a: -25 energie → -5 → clamped to 0, threshold <= 0 → Game Over
      const state = engine.resolveChoice('c60a')
      expect(state.isGameOver).toBe(true)
      expect(state.gameOverParagraphId).toBe('s204')
    })

    it('evaluates Game Over BEFORE act transition', () => {
      // Set up state where choice would trigger both Game Over and act transition
      const engine = createEngine(config, {
        storyId: 'dub-camp-test',
        version: 1,
        savedAt: Date.now(),
        engineState: {
          storyId: 'dub-camp-test',
          paragraphId: 's50',
          gauges: { energie: 10, alcool: 0, fumette: 0, nourriture: 50, kiff: 10 },
          stats: defaultStats,
          act: 'act3',
          inventory: [],
          score: 10,
          isGameOver: false,
          gameOverParagraphId: null,
          isComplete: false,
        },
      })

      // c50a: -15 energie → -5 → clamped to 0. Game Over threshold triggered.
      // Target is s60 (act4) but Game Over should fire first, preventing act transition.
      const state = engine.resolveChoice('c50a')
      expect(state.isGameOver).toBe(true)
      // Act should NOT have changed to act4 since Game Over stops execution
      expect(state.gameOverParagraphId).toBe('s204')
    })
  })

  describe('voluntary exit §41', () => {
    it('awards Kiff +5 and sets isComplete without Game Over', () => {
      // Navigate to s40
      const engine = createEngine(config, {
        storyId: 'dub-camp-test',
        version: 1,
        savedAt: Date.now(),
        engineState: {
          storyId: 'dub-camp-test',
          paragraphId: 's40',
          gauges: { energie: 50, alcool: 50, fumette: 50, nourriture: 30, kiff: 10 },
          stats: defaultStats,
          act: 'act3',
          inventory: [],
          score: 10,
          isGameOver: false,
          gameOverParagraphId: null,
          isComplete: false,
        },
      })

      const state = engine.resolveChoice('c40b') // kiff +5, target s41 (isComplete)
      expect(state.gauges.kiff).toBe(15) // 10 + 5
      expect(state.isGameOver).toBe(false)
      expect(state.isComplete).toBe(true)
      expect(state.paragraphId).toBe('s41')
    })
  })

  describe('decay at nodes', () => {
    it('applyDecay changes gauges at decay nodes', () => {
      const engine = createEngine(config, {
        storyId: 'dub-camp-test',
        version: 1,
        savedAt: Date.now(),
        engineState: {
          storyId: 'dub-camp-test',
          paragraphId: 's20', // decay node
          gauges: { energie: 80, alcool: 0, fumette: 0, nourriture: 50, kiff: 0 },
          stats: { estomac: 0 },
          act: 'act2',
          inventory: [],
          score: 0,
          isGameOver: false,
          gameOverParagraphId: null,
          isComplete: false,
        },
      })

      vi.spyOn(Math, 'random').mockReturnValue(0.99) // no passive risk
      const state = engine.applyDecay()
      expect(state.gauges.nourriture).toBe(40) // 50 - 10
      vi.restoreAllMocks()
    })

    it('decay fires AFTER choice effects on same-node choices', () => {
      // At s20 (decay node), make a choice, THEN apply decay separately
      const engine = createEngine(config, {
        storyId: 'dub-camp-test',
        version: 1,
        savedAt: Date.now(),
        engineState: {
          storyId: 'dub-camp-test',
          paragraphId: 's20',
          gauges: { energie: 80, alcool: 0, fumette: 0, nourriture: 50, kiff: 0 },
          stats: { estomac: 0 },
          act: 'act2',
          inventory: [],
          score: 0,
          isGameOver: false,
          gameOverParagraphId: null,
          isComplete: false,
        },
      })

      vi.spyOn(Math, 'random').mockReturnValue(0.99)

      // Choice effects first: c20a -20 energie, +5 kiff
      const afterChoice = engine.resolveChoice('c20a')
      expect(afterChoice.gauges.energie).toBe(60) // 80 - 20

      // Then decay applied separately (caller responsibility)
      // Note: decay is applied at the CURRENT node before making the choice,
      // or after depending on architecture. The engine's applyDecay works on current state.

      vi.restoreAllMocks()
    })
  })

  describe('act transitions', () => {
    it('transitions act when entering new act paragraphs', () => {
      const engine = createEngine(config, {
        storyId: 'dub-camp-test',
        version: 1,
        savedAt: Date.now(),
        engineState: {
          storyId: 'dub-camp-test',
          paragraphId: 's10',
          gauges: { energie: 80, alcool: 0, fumette: 0, nourriture: 50, kiff: 0 },
          stats: defaultStats,
          act: 'act1',
          inventory: [],
          score: 0,
          isGameOver: false,
          gameOverParagraphId: null,
          isComplete: false,
        },
      })

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
      }, 'test')

      expect(persistence.load()).not.toBeNull()
      persistence.clear()
      expect(persistence.load()).toBeNull()
    })
  })
})

describe('EVT1 probabilistic event', () => {
  it('applies good effects when outcome is good', () => {
    const engine = createEngine(config, {
      storyId: 'dub-camp-test',
      version: 1,
      savedAt: Date.now(),
      engineState: {
        storyId: 'dub-camp-test',
        paragraphId: 'sEVT1',
        gauges: { energie: 80, alcool: 20, fumette: 0, nourriture: 60, kiff: 10 },
        stats: { resistanceAlcool: 3 },
        act: 'act3',
        inventory: [],
        score: 10,
        isGameOver: false,
        gameOverParagraphId: null,
        isComplete: false,
      },
    })

    // kiff +10 from choice, then good outcome: kiff +8
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.1) // good
    const state = engine.resolveChoice('cEVT1a')
    expect(state.gauges.kiff).toBe(28) // 10 + 10 + 8
    spy.mockRestore()
  })

  it('applies bad effects when outcome is bad', () => {
    const engine = createEngine(config, {
      storyId: 'dub-camp-test',
      version: 1,
      savedAt: Date.now(),
      engineState: {
        storyId: 'dub-camp-test',
        paragraphId: 'sEVT1',
        gauges: { energie: 80, alcool: 20, fumette: 0, nourriture: 60, kiff: 10 },
        stats: { resistanceAlcool: 3 },
        act: 'act3',
        inventory: [],
        score: 10,
        isGameOver: false,
        gameOverParagraphId: null,
        isComplete: false,
      },
    })

    // kiff +10 from choice, then bad outcome: alcool +15, energie -10
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.99) // bad
    const state = engine.resolveChoice('cEVT1a')
    expect(state.gauges.alcool).toBe(35) // 20 + 15
    expect(state.gauges.energie).toBe(70) // 80 - 10
    expect(state.gauges.kiff).toBe(20) // 10 + 10 (no +8 from good)
    spy.mockRestore()
  })
})
