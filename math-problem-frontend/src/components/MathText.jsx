import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

const sanitizeContent = (value) => {
  if (!value) return ''
  return String(value)
    .replace(/[¥￥]/g, '\\')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$')
    .replace(/\\\[/g, '')
    .replace(/\\\]/g, '')
    .replace(/\r?\n/g, '\n')
}

const MathText = ({ children, className = '' }) => {
  const content = sanitizeContent(children)

  if (!content.trim()) {
    return null
  }

  const combinedClassName = ['prose', 'prose-sm', 'max-w-none', 'text-gray-800', 'dark:text-gray-100', className]
    .filter(Boolean)
    .join(' ')

  return (
    <ReactMarkdown
      className={combinedClassName}
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
    >
      {content}
    </ReactMarkdown>
  )
}

export default MathText
