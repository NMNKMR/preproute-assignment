import ReactQuill from 'react-quill-new'
import { cn } from '@/lib/cn'

const MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image'],
    ['clean'],
  ],
}

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Type here',
  className,
}: RichTextEditorProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-line [&_.ql-editor]:min-h-44',
        className,
      )}
    >
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={MODULES}
        placeholder={placeholder}
      />
    </div>
  )
}
