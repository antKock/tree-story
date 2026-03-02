import { describe, it, expect } from 'vitest'
import { validateStoryConfig } from './storyValidator'
import { StoryValidationError } from './types'

// ─── Minimal valid config factory ───────────────────────────────────────────

function minimalConfig(overrides: Record<string, unknown> = {}): unknown {
  return {
    id: 'test-story',
    version: 1,
    startParagraphId: 'p1',
    statPointBudget: 10,
    meta: {
      title: 'Test',
      author: 'Test',
      version: '1.0',
      exampleProfiles: [],
    },
    stats: [{ id: 'stat1', name: 'Stat 1', maxPerStat: 5 }],
    gauges: [
      { id: 'gauge1', name: 'Gauge 1', icon: '⚡', initialValue: 50, isScore: true, isHidden: false },
    ],
    acts: [{ id: 'act1', name: 'Act 1', paragraphIds: ['p1'], theme: {} }],
    decayNodes: [],
    decayRules: [],
    paragraphs: {
      p1: {
        id: 'p1',
        content: 'Start.',
        choices: [],
        isComplete: true,
      },
    },
    endStateTiers: [{ minScore: 0, maxScore: 100, text: 'End.' }],
    ...overrides,
  }
}

function assertValidationError(data: unknown, expectedFragment: string) {
  expect(() => validateStoryConfig(data)).toThrow(StoryValidationError)
  expect(() => validateStoryConfig(data)).toThrow(expectedFragment)
}

// ─── Root validation ─────────────────────────────────────────────────────────

describe('validateStoryConfig — root', () => {
  it('accepts a minimal valid config', () => {
    const result = validateStoryConfig(minimalConfig())
    expect(result.id).toBe('test-story')
    expect(result.version).toBe(1)
  })

  it('rejects non-object root', () => {
    assertValidationError(null, 'root must be an object')
    assertValidationError('string', 'root must be an object')
    assertValidationError(42, 'root must be an object')
  })

  it('rejects missing required top-level fields', () => {
    const fields = ['id', 'version', 'startParagraphId', 'statPointBudget', 'meta', 'stats', 'gauges', 'acts', 'decayNodes', 'decayRules', 'paragraphs', 'endStateTiers']
    for (const field of fields) {
      const cfg = minimalConfig() as Record<string, unknown>
      delete cfg[field]
      assertValidationError(cfg, `missing required field '${field}'`)
    }
  })

  it('rejects wrong type for top-level scalar fields', () => {
    assertValidationError(minimalConfig({ id: 123 }), "'id' in root must be a string")
    assertValidationError(minimalConfig({ version: 'v1' }), "'version' in root must be a number")
    assertValidationError(minimalConfig({ startParagraphId: 99 }), "'startParagraphId' in root must be a string")
    assertValidationError(minimalConfig({ statPointBudget: 'ten' }), "'statPointBudget' in root must be a number")
  })
})

// ─── startParagraphId referential integrity ───────────────────────────────────

describe('validateStoryConfig — startParagraphId', () => {
  it('rejects startParagraphId referencing non-existent paragraph', () => {
    assertValidationError(
      minimalConfig({ startParagraphId: 'missing' }),
      "startParagraphId 'missing' references non-existent paragraph"
    )
  })
})

// ─── Stats validation ─────────────────────────────────────────────────────────

describe('validateStoryConfig — stats', () => {
  it('rejects empty stats array', () => {
    assertValidationError(minimalConfig({ stats: [] }), 'stats array must have at least 1 entry')
  })

  it('rejects stat missing id', () => {
    assertValidationError(
      minimalConfig({ stats: [{ name: 'S', maxPerStat: 5 }] }),
      "missing required field 'id'"
    )
  })

  it('rejects stat with non-number maxPerStat', () => {
    assertValidationError(
      minimalConfig({ stats: [{ id: 's1', name: 'S', maxPerStat: 'five' }] }),
      "'maxPerStat' in stats[0] must be a number"
    )
  })
})

// ─── Gauge validation ─────────────────────────────────────────────────────────

describe('validateStoryConfig — gauges', () => {
  it('rejects empty gauges array', () => {
    assertValidationError(minimalConfig({ gauges: [] }), 'gauges array must have at least 1 entry')
  })

  it('rejects config with no score gauge', () => {
    assertValidationError(
      minimalConfig({
        gauges: [{ id: 'g1', name: 'G', icon: '⚡', initialValue: 50, isScore: false, isHidden: false }],
      }),
      'exactly one gauge must have isScore: true, found 0'
    )
  })

  it('rejects config with two score gauges', () => {
    assertValidationError(
      minimalConfig({
        gauges: [
          { id: 'g1', name: 'G1', icon: '⚡', initialValue: 50, isScore: true, isHidden: false },
          { id: 'g2', name: 'G2', icon: '🔥', initialValue: 0, isScore: true, isHidden: false },
        ],
      }),
      'exactly one gauge must have isScore: true, found 2'
    )
  })

  it('rejects gauge with gameOverThreshold but no gameOverCondition', () => {
    assertValidationError(
      minimalConfig({
        gauges: [{
          id: 'g1', name: 'G', icon: '⚡', initialValue: 50, isScore: true, isHidden: false,
          gameOverThreshold: 0,
          // gameOverCondition absent
          gameOverParagraphId: 'p1',
        }],
      }),
      "must define both gameOverThreshold and gameOverCondition, or neither"
    )
  })

  it('rejects gauge with gameOverThreshold but no gameOverParagraphId', () => {
    assertValidationError(
      minimalConfig({
        gauges: [{
          id: 'g1', name: 'G', icon: '⚡', initialValue: 50, isScore: true, isHidden: false,
          gameOverThreshold: 0,
          gameOverCondition: 'below',
          // gameOverParagraphId absent
        }],
      }),
      "has gameOverThreshold but no gameOverParagraphId"
    )
  })

  it('rejects gauge gameOverParagraphId referencing non-existent paragraph', () => {
    assertValidationError(
      minimalConfig({
        gauges: [{
          id: 'g1', name: 'G', icon: '⚡', initialValue: 50, isScore: true, isHidden: false,
          gameOverThreshold: 0,
          gameOverCondition: 'below',
          gameOverParagraphId: 'nope',
        }],
      }),
      "gameOverParagraphId 'nope' references non-existent paragraph"
    )
  })

  it('rejects invalid gameOverCondition value', () => {
    assertValidationError(
      minimalConfig({
        gauges: [{
          id: 'g1', name: 'G', icon: '⚡', initialValue: 50, isScore: true, isHidden: false,
          gameOverThreshold: 0,
          gameOverCondition: 'sideways',
          gameOverParagraphId: 'p1',
        }],
      }),
      "must be 'above' or 'below'"
    )
  })
})

// ─── Acts validation ──────────────────────────────────────────────────────────

describe('validateStoryConfig — acts', () => {
  it('rejects empty acts array', () => {
    assertValidationError(minimalConfig({ acts: [] }), 'acts array must have at least 1 entry')
  })

  it('rejects act paragraphIds referencing non-existent paragraph', () => {
    assertValidationError(
      minimalConfig({
        acts: [{ id: 'act1', name: 'Act 1', paragraphIds: ['missing'], theme: {} }],
      }),
      "act 'act1' references non-existent paragraphId 'missing'"
    )
  })

  it('rejects non-string act theme value', () => {
    assertValidationError(
      minimalConfig({
        acts: [{ id: 'act1', name: 'Act 1', paragraphIds: ['p1'], theme: { '--color-bg': 123 } }],
      }),
      'theme.--color-bg must be a string'
    )
  })
})

// ─── Paragraphs / Choices validation ─────────────────────────────────────────

describe('validateStoryConfig — paragraphs', () => {
  it('rejects choice with non-existent targetParagraphId', () => {
    assertValidationError(
      minimalConfig({
        paragraphs: {
          p1: {
            id: 'p1',
            content: 'Start.',
            choices: [{ id: 'c1', text: 'Go', targetParagraphId: 'missing' }],
          },
        },
      }),
      "references non-existent targetParagraphId 'missing'"
    )
  })

  it('rejects conditionalBranch with non-existent targetParagraphId', () => {
    assertValidationError(
      minimalConfig({
        paragraphs: {
          p1: {
            id: 'p1',
            content: 'Start.',
            choices: [{
              id: 'c1', text: 'Go', targetParagraphId: 'p1',
              conditionalBranch: { probability: 0.5, targetParagraphId: 'nope' },
            }],
          },
        },
      }),
      "conditionalBranch references non-existent targetParagraphId 'nope'"
    )
  })

  it('rejects conditionalBranch probability outside [0, 1]', () => {
    assertValidationError(
      minimalConfig({
        paragraphs: {
          p1: {
            id: 'p1',
            content: 'Start.',
            choices: [{
              id: 'c1', text: 'Go', targetParagraphId: 'p1',
              conditionalBranch: { probability: 1.5, targetParagraphId: 'p1' },
            }],
          },
        },
      }),
      "'probability' in paragraph 'p1' choice 'c1' conditionalBranch must be between 0.0 and 1.0"
    )
  })

  it('rejects contextualGameOver with non-existent targetParagraphId', () => {
    assertValidationError(
      minimalConfig({
        paragraphs: {
          p1: {
            id: 'p1',
            content: 'Start.',
            choices: [],
            isComplete: true,
            contextualGameOver: [{
              gaugeId: 'gauge1',
              threshold: 10,
              condition: 'below',
              targetParagraphId: 'nope',
            }],
          },
        },
      }),
      "contextualGameOver in paragraph 'p1' references non-existent targetParagraphId 'nope'"
    )
  })

  it('rejects contextualGameOver gaugeId referencing non-existent gauge', () => {
    assertValidationError(
      minimalConfig({
        paragraphs: {
          p1: {
            id: 'p1',
            content: 'Start.',
            choices: [],
            isComplete: true,
            contextualGameOver: [{
              gaugeId: 'no-such-gauge',
              threshold: 10,
              condition: 'below',
              targetParagraphId: 'p1',
            }],
          },
        },
      }),
      "references non-existent gauge 'no-such-gauge'"
    )
  })
})

// ─── WeightedOutcome validation ───────────────────────────────────────────────

describe('validateStoryConfig — weightedOutcome', () => {
  function configWithWeightedOutcome(wo: unknown): unknown {
    return minimalConfig({
      paragraphs: {
        p1: {
          id: 'p1',
          content: 'Start.',
          choices: [{
            id: 'c1',
            text: 'Roll',
            targetParagraphId: 'p1',
            weightedOutcome: wo,
          }],
          isComplete: true,
        },
      },
    })
  }

  const validWO = {
    gaugeId: 'gauge1',
    statId: 'stat1',
    outcomes: [
      { id: 'a', maxRisk: 50, text: 'Good', effects: [] },
      { id: 'b', maxRisk: 100, text: 'Bad', effects: [] },
    ],
  }

  it('accepts a valid weightedOutcome', () => {
    const result = validateStoryConfig(configWithWeightedOutcome(validWO))
    expect(result).toBeTruthy()
  })

  it('rejects deprecated goodEffects/badEffects shape', () => {
    assertValidationError(
      configWithWeightedOutcome({ gaugeId: 'gauge1', statId: 'stat1', goodEffects: [], badEffects: [] }),
      'deprecated goodEffects/badEffects'
    )
  })

  it('rejects empty outcomes array', () => {
    assertValidationError(
      configWithWeightedOutcome({ ...validWO, outcomes: [] }),
      "'outcomes' in paragraph 'p1' choice 'c1' weightedOutcome must have at least 1 entry"
    )
  })

  it('rejects last outcome with maxRisk < 100', () => {
    assertValidationError(
      configWithWeightedOutcome({
        ...validWO,
        outcomes: [
          { id: 'a', maxRisk: 50, text: 'Good', effects: [] },
          { id: 'b', maxRisk: 90, text: 'Bad', effects: [] },
        ],
      }),
      'last outcome branch in paragraph'
    )
  })

  it('rejects weightedOutcome with non-existent gaugeId', () => {
    assertValidationError(
      configWithWeightedOutcome({ ...validWO, gaugeId: 'no-gauge' }),
      "references non-existent gauge 'no-gauge'"
    )
  })

  it('rejects weightedOutcome with non-existent statId', () => {
    assertValidationError(
      configWithWeightedOutcome({ ...validWO, statId: 'no-stat' }),
      "references non-existent stat 'no-stat'"
    )
  })

  it('rejects hungerGaugeId referencing non-existent gauge', () => {
    assertValidationError(
      configWithWeightedOutcome({ ...validWO, hungerGaugeId: 'no-gauge' }),
      "hungerGaugeId references non-existent gauge 'no-gauge'"
    )
  })

  it('rejects statMultiplier <= 0', () => {
    assertValidationError(
      configWithWeightedOutcome({ ...validWO, statMultiplier: 0 }),
      "'statMultiplier' in paragraph 'p1' choice 'c1' weightedOutcome must be greater than 0"
    )
    assertValidationError(
      configWithWeightedOutcome({ ...validWO, statMultiplier: -5 }),
      "'statMultiplier' in paragraph 'p1' choice 'c1' weightedOutcome must be greater than 0"
    )
  })

  it('rejects non-number statMultiplier', () => {
    assertValidationError(
      configWithWeightedOutcome({ ...validWO, statMultiplier: 'high' }),
      "'statMultiplier' in paragraph 'p1' choice 'c1' weightedOutcome must be a number"
    )
  })

  it('accepts valid hungerGaugeId and statMultiplier', () => {
    const result = validateStoryConfig(
      configWithWeightedOutcome({ ...validWO, hungerGaugeId: 'gauge1', statMultiplier: 10 })
    )
    const wo = result.paragraphs['p1'].choices[0].weightedOutcome!
    expect(wo.hungerGaugeId).toBe('gauge1')
    expect(wo.statMultiplier).toBe(10)
  })

  it('leaves hungerGaugeId and statMultiplier undefined when absent', () => {
    const result = validateStoryConfig(configWithWeightedOutcome(validWO))
    const wo = result.paragraphs['p1'].choices[0].weightedOutcome!
    expect(wo.hungerGaugeId).toBeUndefined()
    expect(wo.statMultiplier).toBeUndefined()
  })
})

// ─── DecayRules validation ────────────────────────────────────────────────────

describe('validateStoryConfig — decayRules', () => {
  it('rejects probabilityChance outside [0, 1]', () => {
    assertValidationError(
      minimalConfig({
        decayRules: [{ gaugeId: 'gauge1', amount: -5, probabilityChance: 1.5 }],
      }),
      "'probabilityChance' in decayRules[0] must be between 0.0 and 1.0"
    )
  })

  it('rejects non-number probabilityChance', () => {
    assertValidationError(
      minimalConfig({
        decayRules: [{ gaugeId: 'gauge1', amount: -5, probabilityChance: 'high' }],
      }),
      "'probabilityChance' in decayRules[0] must be a number"
    )
  })
})

// ─── DecayNodes validation ────────────────────────────────────────────────────

describe('validateStoryConfig — decayNodes', () => {
  it('rejects decayNode referencing non-existent paragraph', () => {
    assertValidationError(
      minimalConfig({ decayNodes: ['missing'] }),
      "decayNodes references non-existent paragraph ID 'missing'"
    )
  })
})

// ─── ScoreMultipliers validation ──────────────────────────────────────────────

describe('validateStoryConfig — scoreMultipliers', () => {
  it('rejects scoreMultiplier with multiplier <= 0', () => {
    assertValidationError(
      minimalConfig({
        scoreMultipliers: [{ conditions: [{ gaugeId: 'gauge1', min: 20 }], multiplier: 0 }],
      }),
      "'multiplier' in scoreMultipliers[0] must be greater than 0"
    )
  })

  it('rejects scoreMultiplier condition with non-existent gaugeId', () => {
    assertValidationError(
      minimalConfig({
        scoreMultipliers: [{ conditions: [{ gaugeId: 'no-gauge', min: 20 }], multiplier: 1.5 }],
      }),
      "references non-existent gauge 'no-gauge'"
    )
  })

  it('accepts valid scoreMultipliers', () => {
    const result = validateStoryConfig(
      minimalConfig({
        scoreMultipliers: [{ conditions: [{ gaugeId: 'gauge1', min: 20, max: 80 }], multiplier: 1.5 }],
      })
    )
    expect(result.scoreMultipliers?.[0].multiplier).toBe(1.5)
  })
})

// ─── CompositeGameOverRules validation ────────────────────────────────────────

describe('validateStoryConfig — compositeGameOverRules', () => {
  it('rejects compositeGameOverRule with non-existent targetParagraphId', () => {
    assertValidationError(
      minimalConfig({
        compositeGameOverRules: [{
          conditions: [{ gaugeId: 'gauge1', max: 10 }],
          targetParagraphId: 'nope',
        }],
      }),
      "compositeGameOverRules[0] references non-existent targetParagraphId 'nope'"
    )
  })

  it('rejects compositeGameOverRule condition with non-existent gaugeId', () => {
    assertValidationError(
      minimalConfig({
        compositeGameOverRules: [{
          conditions: [{ gaugeId: 'no-gauge', max: 10 }],
          targetParagraphId: 'p1',
        }],
      }),
      "references non-existent gauge 'no-gauge'"
    )
  })

  it('rejects compositeGameOverRule probability outside [0, 1]', () => {
    assertValidationError(
      minimalConfig({
        compositeGameOverRules: [{
          conditions: [{ gaugeId: 'gauge1', max: 10 }],
          targetParagraphId: 'p1',
          probability: -0.1,
        }],
      }),
      "'probability' in compositeGameOverRules[0] must be between 0.0 and 1.0"
    )
  })
})

// ─── EndStateTiers validation ─────────────────────────────────────────────────

describe('validateStoryConfig — endStateTiers', () => {
  it('rejects tier missing minScore', () => {
    assertValidationError(
      minimalConfig({ endStateTiers: [{ maxScore: 100, text: 'End.' }] }),
      "missing required field 'minScore'"
    )
  })

  it('rejects tier with non-string text', () => {
    assertValidationError(
      minimalConfig({ endStateTiers: [{ minScore: 0, maxScore: 100, text: 42 }] }),
      "'text' in endStateTiers[0] must be a string"
    )
  })
})

// ─── Meta / ExampleProfiles validation ───────────────────────────────────────

describe('validateStoryConfig — meta', () => {
  it('rejects meta missing title', () => {
    assertValidationError(
      minimalConfig({ meta: { author: 'A', version: '1', exampleProfiles: [] } }),
      "missing required field 'title' in meta"
    )
  })

  it('rejects exampleProfile with non-number stat value', () => {
    assertValidationError(
      minimalConfig({
        meta: {
          title: 'T',
          author: 'A',
          version: '1',
          exampleProfiles: [{ name: 'P', description: 'D', stats: { stat1: 'five' } }],
        },
      }),
      "stat 'stat1' in example profile 'P' must be a number"
    )
  })

  it('accepts meta with optional introText and description', () => {
    const result = validateStoryConfig(
      minimalConfig({
        meta: {
          title: 'T', author: 'A', version: '1',
          description: 'A story.',
          introText: 'Welcome!',
          exampleProfiles: [],
        },
      })
    )
    expect(result.meta.description).toBe('A story.')
  })
})
