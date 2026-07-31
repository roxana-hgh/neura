/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EditorData, EditorBlock } from './Editor/Editor'

interface BlockRendererProps {
  block: EditorBlock
}

const BlockRenderer = ({ block }: BlockRendererProps) => {
  switch (block.type) {
    case 'paragraph':
      return (
        <p className="mb-3 leading-relaxed">
          {block.data?.text || ''}
        </p>
      )

    case 'header': {
      const headerLevel = block.data?.level || 2
      const headerClass: Record<number, string> = {
        1: 'text-3xl font-bold',
        2: 'text-2xl font-bold',
        3: 'text-xl font-bold',
        4: 'text-lg font-bold',
        5: 'text-base font-bold',
        6: 'text-sm font-bold',
      }
      const Header = `h${headerLevel}` as any
      return (
        <Header className={`mb-4 mt-4 ${headerClass[headerLevel] || 'text-2xl font-bold'}`}>
          {block.data?.text || ''}
        </Header>
      )
    }

    case 'list': {
      const isOrdered = block.data?.style === 'ordered'
      const ListTag = isOrdered ? 'ol' : 'ul'
      return (
        <ListTag className={`mb-3 pl-6 ${isOrdered ? 'list-decimal' : 'list-disc'}`}>
          {block.data?.items?.map((item: string, idx: number) => (
            <li key={idx} className="mb-2">
              {item}
            </li>
          ))}
        </ListTag>
      )
    }

    case 'code':
      return (
        <pre className="mb-3 bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code className="text-sm font-mono">
            {block.data?.code || ''}
          </code>
        </pre>
      )

    case 'image':
      return (
        <figure className="mb-4">
          {block.data?.url && (
            <img
              src={block.data.url}
              alt={block.data?.caption || 'Image'}
              className="max-w-full h-auto rounded-lg"
            />
          )}
          {block.data?.caption && (
            <figcaption className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
              {block.data.caption}
            </figcaption>
          )}
        </figure>
      )

    case 'simpleImage':
      return (
        <figure className="mb-4">
          {block.data?.url && (
            <img
              src={block.data.url}
              alt="Image"
              className="max-w-full h-auto rounded-lg"
            />
          )}
        </figure>
      )

    case 'checklist':
      return (
        <div className="mb-3 space-y-2">
          {block.data?.items?.map((item: { text: string; checked: boolean }, idx: number) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.checked}
                readOnly
                className="w-4 h-4"
              />
              <span className={item.checked ? 'line-through text-gray-500' : ''}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      )

    case 'raw':
      return (
        <div
          className="mb-3 prose prose-sm dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: block.data?.html || '' }}
        />
      )

    case 'marker':
      return (
        <mark className="bg-yellow-200 dark:bg-yellow-800 rounded px-1">
          {block.data?.text || ''}
        </mark>
      )

    case 'inlineCode':
      return (
        <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded font-mono text-sm">
          {block.data?.code || ''}
        </code>
      )

    case 'linkTool':
      return (
        <a
          href={block.data?.link || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
        >
          {block.data?.meta?.image && (
            <img
              src={block.data.meta.image.url}
              alt="Link preview"
              className="w-full h-32 object-cover rounded mb-2"
            />
          )}
          <div className="font-semibold text-blue-600 dark:text-blue-400">
            {block.data?.meta?.title || block.data?.link}
          </div>
          {block.data?.meta?.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {block.data.meta.description}
            </p>
          )}
        </a>
      )

    default:
      return null
  }
}

interface EditorBlocksDisplayProps {
  data?: EditorData
  className?: string
}

export function EditorBlocksDisplay({ data, className = '' }: EditorBlocksDisplayProps) {
  if (!data?.blocks || data.blocks.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">No content</p>
  }

  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>
      {data.blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </div>
  )
}

export default EditorBlocksDisplay
