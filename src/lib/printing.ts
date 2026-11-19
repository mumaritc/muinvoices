export async function printInvoice(
  root: HTMLElement | null,
  flush: () => Promise<void>,
  stillCurrent: () => boolean = () => true,
) {
  if (!root) throw new Error('Preview is not ready')
  await flush()
  await document.fonts.ready
  await Promise.all(
    Array.from(root.querySelectorAll('img'), async (image) => {
      await image.decode()
      if (!image.naturalWidth) throw new Error('Image is not ready for print')
    }),
  )
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  )
  if (!stillCurrent())
    throw new Error(
      'Invoice changed while preparing print. Review the current preview and try again.',
    )
  window.print()
}
