'use client'

import { renderMarkdownLite } from './renderMarkdownLite'

interface ParagraphDisplayProps {
  content: string
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
