export const MAX_BYTES = 500 * 1024

function toBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', quality),
  )
}

/** 이미지를 JPEG 500KB 이하로 압축 (긴 변 축소 + 품질 단계적 하향). 브라우저 전용 */
export async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  let scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unsupported')

  let blob: Blob | null = null
  for (let attempt = 0; attempt < 8; attempt++) {
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    for (const q of [0.85, 0.75, 0.65, 0.55, 0.45]) {
      blob = await toBlob(canvas, q)
      if (blob.size <= MAX_BYTES) {
        bitmap.close()
        return new File([blob], 'photo.jpg', { type: 'image/jpeg' })
      }
    }
    scale *= 0.8
  }
  bitmap.close()
  throw new Error('500KB 이하로 압축하지 못했어요')
}
