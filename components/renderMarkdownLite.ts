import React from 'react'

/**
 * Minimal inline markdown renderer supporting **bold** and *italic*.
 * Bold is processed before italic to avoid ambiguity with adjacent asterisks.
 */
export function renderMarkdownLite(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const regex = /\*\*(.+?)\*\*|(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    if (match[1] !== undefined) {
      parts.push(React.createElement('strong', { key: key++ }, match[1]))
    } else if (match[2] !== undefined) {
      parts.push(React.createElement('em', { key: key++ }, match[2]))
    }
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}
