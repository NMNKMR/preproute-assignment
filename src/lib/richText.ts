/** Strip HTML tags to test whether a rich-text value actually has content. */
export function isRichTextEmpty(html: string): boolean {
  return (
    html
      .replace(/<(.|\n)*?>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim().length === 0
  )
}
