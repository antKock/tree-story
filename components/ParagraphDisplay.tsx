'use client'

interface ParagraphDisplayProps {
  content: string
}

function renderMarkdownLite(text: string): React.ReactNode[] {
  // Process bold (**text**) before italic (*text*) to avoid ambiguity.
  // Uses a single regex with bold alternative first so ** is matched before *.
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
      // Bold: **text**
      parts.push(<strong key={key++}>{match[1]}</strong>)
    } else if (match[2] !== undefined) {
      // Italic: *text* (not adjacent to other *)
      parts.push(<em key={key++}>{match[2]}</em>)
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

export default function ParagraphDisplay({ content }: ParagraphDisplayProps) {
  // Split on double newlines for paragraph breaks
  const paragraphs = content.split(/\n\n+/)

  return (
    <div className="reading-column prose-text">
      {paragraphs.map((para, i) => (
        <p key={i} style={{ marginBottom: '1.25em', marginTop: 0 }}>
          {renderMarkdownLite(para.trim())}
        </p>
      ))}
    </div>
  )
}
