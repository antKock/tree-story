// Pure engine module — zero imports from components/, hooks/, app/, or lib/
// Safe mathematical expression evaluator for story-defined formulas.
// Supports: numbers, variables (base, stat), arithmetic (+, -, *, /),
// parentheses, and functions (max, min, abs).
// No eval() or Function() — parsed via recursive descent.

type Variables = Record<string, number>

interface Token {
  type: 'number' | 'variable' | 'operator' | 'lparen' | 'rparen' | 'comma' | 'function'
  value: string
  numericValue?: number
}

function tokenize(expr: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < expr.length) {
    const ch = expr[i]

    if (ch === ' ' || ch === '\t') {
      i++
      continue
    }

    if (ch >= '0' && ch <= '9' || ch === '.') {
      let num = ''
      let dotCount = 0
      while (i < expr.length && (expr[i] >= '0' && expr[i] <= '9' || expr[i] === '.')) {
        if (expr[i] === '.') dotCount++
        if (dotCount > 1) {
          throw new Error(`Malformed number '${num}.' in formula: ${expr}`)
        }
        num += expr[i]
        i++
      }
      tokens.push({ type: 'number', value: num })
      continue
    }

    if (ch >= 'a' && ch <= 'z' || ch >= 'A' && ch <= 'Z' || ch === '_') {
      let name = ''
      while (i < expr.length && (expr[i] >= 'a' && expr[i] <= 'z' || expr[i] >= 'A' && expr[i] <= 'Z' || expr[i] === '_' || expr[i] >= '0' && expr[i] <= '9')) {
        name += expr[i]
        i++
      }
      const FUNCTIONS = ['max', 'min', 'abs']
      if (FUNCTIONS.includes(name)) {
        tokens.push({ type: 'function', value: name })
      } else {
        tokens.push({ type: 'variable', value: name })
      }
      continue
    }

    if (ch === '(') { tokens.push({ type: 'lparen', value: ch }); i++; continue }
    if (ch === ')') { tokens.push({ type: 'rparen', value: ch }); i++; continue }
    if (ch === ',') { tokens.push({ type: 'comma', value: ch }); i++; continue }
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      tokens.push({ type: 'operator', value: ch })
      i++
      continue
    }

    throw new Error(`Unexpected character '${ch}' in formula: ${expr}`)
  }

  return tokens
}

// Recursive descent parser: expr → term ((+|-) term)*
//                            term → factor ((*|/) factor)*
//                            factor → unary | number | variable | function | (expr)
//                            unary → (+|-) factor
class Parser {
  private pos: number = 0

  constructor(private tokens: Token[]) {}

  parse(): number {
    const result: number = this.parseExpr()
    if (this.pos < this.tokens.length) {
      throw new Error(`Unexpected token: ${this.tokens[this.pos].value}`)
    }
    return result
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos]
  }

  private consume(): Token {
    return this.tokens[this.pos++]
  }

  private parseExpr(): number {
    let left: number = this.parseTerm()
    while (this.peek()?.type === 'operator' && (this.peek()!.value === '+' || this.peek()!.value === '-')) {
      const op: string = this.consume().value
      const right: number = this.parseTerm()
      left = op === '+' ? left + right : left - right
    }
    return left
  }

  private parseTerm(): number {
    let left: number = this.parseFactor()
    while (this.peek()?.type === 'operator' && (this.peek()!.value === '*' || this.peek()!.value === '/')) {
      const op: string = this.consume().value
      const right: number = this.parseFactor()
      if (op === '/') {
        if (right === 0) {
          throw new Error('Division by zero in formula')
        }
        left = left / right
      } else {
        left = left * right
      }
    }
    return left
  }

  private parseFactor(): number {
    const token: Token | undefined = this.peek()
    if (!token) throw new Error('Unexpected end of formula')

    // Unary minus
    if (token.type === 'operator' && token.value === '-') {
      this.consume()
      return -this.parseFactor()
    }

    // Unary plus
    if (token.type === 'operator' && token.value === '+') {
      this.consume()
      return this.parseFactor()
    }

    // Number literal — use pre-computed numericValue if available (from variable substitution)
    if (token.type === 'number') {
      this.consume()
      if (token.numericValue !== undefined) {
        return token.numericValue
      }
      return parseFloat(token.value)
    }

    // Variable — should not be reached after substitution in evaluateFormula
    if (token.type === 'variable') {
      this.consume()
      throw new Error(`Unresolved variable: ${token.value}`)
    }

    // Function call: max(a, b, ...), min(a, b, ...), abs(a)
    if (token.type === 'function') {
      const fname: string = this.consume().value
      if (this.peek()?.type !== 'lparen') {
        throw new Error(`Expected '(' after function ${fname}`)
      }
      this.consume() // (

      const args: number[] = []
      if (this.peek()?.type !== 'rparen') {
        args.push(this.parseExpr())
        while (this.peek()?.type === 'comma') {
          this.consume() // ,
          // Trailing comma check: if next token is ')' after consuming comma, that's an error
          if (this.peek()?.type === 'rparen') {
            throw new Error(`Trailing comma in ${fname}() arguments`)
          }
          args.push(this.parseExpr())
        }
      }

      if (this.peek()?.type !== 'rparen') {
        throw new Error(`Expected ')' after function arguments`)
      }
      this.consume() // )

      switch (fname) {
        case 'max': {
          if (args.length < 1) throw new Error('max() requires at least 1 argument')
          return Math.max(...args)
        }
        case 'min': {
          if (args.length < 1) throw new Error('min() requires at least 1 argument')
          return Math.min(...args)
        }
        case 'abs': {
          if (args.length !== 1) throw new Error('abs() requires exactly 1 argument')
          return Math.abs(args[0])
        }
        default: throw new Error(`Unknown function: ${fname}`)
      }
    }

    // Parenthesized expression
    if (token.type === 'lparen') {
      this.consume() // (
      const result: number = this.parseExpr()
      if (this.peek()?.type !== 'rparen') {
        throw new Error(`Expected ')'`)
      }
      this.consume() // )
      return result
    }

    throw new Error(`Unexpected token: ${token.value}`)
  }
}

/**
 * Evaluates a mathematical formula string with variable substitution.
 * Supports: numbers, +, -, *, /, parentheses, max(), min(), abs().
 * Variables in the formula are replaced by values from the `variables` map.
 * Any variable name in the formula that matches a key in `variables` is substituted.
 */
export function evaluateFormula(formula: string, variables: Variables): number {
  const tokens: Token[] = tokenize(formula)

  // Substitute variables with their numeric values directly (no string round-trip)
  const substituted: Token[] = tokens.map((token: Token): Token => {
    if (token.type === 'variable') {
      const val: number | undefined = variables[token.value]
      if (val === undefined) {
        throw new Error(`Unknown variable '${token.value}' in formula: ${formula}`)
      }
      return { type: 'number', value: String(val), numericValue: val }
    }
    return token
  })

  const parser: Parser = new Parser(substituted)
  return parser.parse()
}
