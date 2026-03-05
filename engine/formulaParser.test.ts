import { describe, it, expect } from 'vitest'
import { evaluateFormula } from './formulaParser'

describe('evaluateFormula', () => {
  describe('basic arithmetic', () => {
    it('evaluates addition', () => {
      expect(evaluateFormula('2 + 3', {})).toBe(5)
    })

    it('evaluates subtraction', () => {
      expect(evaluateFormula('10 - 4', {})).toBe(6)
    })

    it('evaluates multiplication', () => {
      expect(evaluateFormula('3 * 5', {})).toBe(15)
    })

    it('evaluates division', () => {
      expect(evaluateFormula('10 / 4', {})).toBe(2.5)
    })

    it('respects operator precedence', () => {
      expect(evaluateFormula('2 + 3 * 4', {})).toBe(14)
    })

    it('handles parentheses', () => {
      expect(evaluateFormula('(2 + 3) * 4', {})).toBe(20)
    })

    it('handles unary minus', () => {
      expect(evaluateFormula('-5 + 3', {})).toBe(-2)
    })

    it('handles unary plus', () => {
      expect(evaluateFormula('+5 + 3', {})).toBe(8)
    })

    it('throws on division by zero', () => {
      expect(() => evaluateFormula('10 / 0', {})).toThrow('Division by zero')
    })

    it('throws on division by zero via variable', () => {
      expect(() => evaluateFormula('10 / x', { x: 0 })).toThrow('Division by zero')
    })
  })

  describe('variables', () => {
    it('substitutes a single variable', () => {
      expect(evaluateFormula('stat * 2', { stat: 4 })).toBe(8)
    })

    it('substitutes multiple variables', () => {
      expect(evaluateFormula('base - stat * 1.5', { base: 10, stat: 4 })).toBe(4)
    })

    it('throws on unknown variable', () => {
      expect(() => evaluateFormula('unknown + 1', {})).toThrow("Unknown variable 'unknown'")
    })

    it('preserves numeric precision without string round-trip', () => {
      expect(evaluateFormula('x + 0', { x: 0.1 + 0.2 })).toBeCloseTo(0.3)
    })
  })

  describe('functions', () => {
    it('evaluates max with two args', () => {
      expect(evaluateFormula('max(3, 7)', {})).toBe(7)
    })

    it('evaluates max with three args', () => {
      expect(evaluateFormula('max(1, 5, 3)', {})).toBe(5)
    })

    it('evaluates min with two args', () => {
      expect(evaluateFormula('min(3, 7)', {})).toBe(3)
    })

    it('evaluates abs', () => {
      expect(evaluateFormula('abs(-5)', {})).toBe(5)
    })

    it('evaluates nested functions', () => {
      expect(evaluateFormula('max(3, min(10, 5))', {})).toBe(5)
    })

    it('evaluates max with expressions as args', () => {
      expect(evaluateFormula('max(3, 10 - 4 * 1.5)', {})).toBe(4)
    })

    it('throws on max with zero args', () => {
      expect(() => evaluateFormula('max()', {})).toThrow('max() requires at least 1 argument')
    })

    it('throws on min with zero args', () => {
      expect(() => evaluateFormula('min()', {})).toThrow('min() requires at least 1 argument')
    })

    it('evaluates max with unary plus in arg', () => {
      expect(evaluateFormula('max(+3, 7)', {})).toBe(7)
    })

    it('throws on trailing comma in function args', () => {
      expect(() => evaluateFormula('abs(5,)', {})).toThrow('Trailing comma')
    })

    it('throws on trailing comma in max args', () => {
      expect(() => evaluateFormula('max(3, 5,)', {})).toThrow('Trailing comma')
    })
  })

  describe('Dub Camp formula: max(3, 10 - stat * 1.5)', () => {
    const formula = 'max(3, 10 - stat * 1.5)'

    it('estomac=0: result = 10', () => {
      expect(evaluateFormula(formula, { stat: 0 })).toBe(10)
    })

    it('estomac=4: result = max(3, 4) = 4', () => {
      expect(evaluateFormula(formula, { stat: 4 })).toBe(4)
    })

    it('estomac=6: result = max(3, 1) = 3 (floor)', () => {
      expect(evaluateFormula(formula, { stat: 6 })).toBe(3)
    })

    it('estomac=10: result = max(3, -5) = 3 (floor)', () => {
      expect(evaluateFormula(formula, { stat: 10 })).toBe(3)
    })
  })

  describe('Dub Camp formula with stat name: max(3, 10 - estomac * 1.5)', () => {
    const formula = 'max(3, 10 - estomac * 1.5)'

    it('estomac=0: result = 10', () => {
      expect(evaluateFormula(formula, { estomac: 0 })).toBe(10)
    })

    it('estomac=4: result = 4', () => {
      expect(evaluateFormula(formula, { estomac: 4 })).toBe(4)
    })

    it('estomac=6: result = 3 (floor)', () => {
      expect(evaluateFormula(formula, { estomac: 6 })).toBe(3)
    })
  })

  describe('edge cases', () => {
    it('handles decimal numbers', () => {
      expect(evaluateFormula('1.5 * 2', {})).toBe(3)
    })

    it('handles multiple spaces', () => {
      expect(evaluateFormula('  3  +  4  ', {})).toBe(7)
    })

    it('throws on invalid character', () => {
      expect(() => evaluateFormula('3 & 4', {})).toThrow("Unexpected character '&'")
    })

    it('throws on empty expression', () => {
      expect(() => evaluateFormula('', {})).toThrow()
    })

    it('throws on malformed number with multiple dots', () => {
      expect(() => evaluateFormula('3..5 + 1', {})).toThrow('Malformed number')
    })

    it('throws on number like 1.2.3', () => {
      expect(() => evaluateFormula('1.2.3', {})).toThrow('Malformed number')
    })
  })
})
