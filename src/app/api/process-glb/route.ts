import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const TARGET_METERS = 0.15

export async function POST(request: Request) {
  try {
    let formData: FormData
    try {
      formData = await request.formData()
    } catch {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
    }

    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!file.name.toLowerCase().endsWith('.glb')) {
      return NextResponse.json({ error: 'File must be a .glb' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const inputBytes = new Uint8Array(arrayBuffer)

    // Try to process with gltf-transform; fall back to original if anything fails
    try {
      // Dynamic import to avoid bundling issues on Vercel
      const { NodeIO, getBounds } = await import('@gltf-transform/core')
      const { center } = await import('@gltf-transform/functions')

      const io = new NodeIO()
      const document = await io.readBinary(inputBytes)

      const root = document.getRoot()
      const scene = root.getDefaultScene() ?? root.listScenes()[0]

      if (scene) {
        await document.transform(center({ pivot: 'below' }))

        const bounds = getBounds(scene)
        const maxDim = Math.max(
          bounds.max[0] - bounds.min[0],
          bounds.max[1] - bounds.min[1],
          bounds.max[2] - bounds.min[2],
        )

        if (maxDim > 0 && Math.abs(maxDim - TARGET_METERS) > 0.001) {
          const s = TARGET_METERS / maxDim
          for (const node of scene.listChildren()) {
            const [sx, sy, sz] = node.getScale()
            node.setScale([sx * s, sy * s, sz * s])
          }
        }

        const outputBytes = await io.writeBinary(document)
        return new Response(Buffer.from(outputBytes), {
          status: 200,
          headers: {
            'Content-Type': 'model/gltf-binary',
            'Content-Disposition': 'attachment; filename="model.glb"',
            'Content-Length': String(outputBytes.byteLength),
          },
        })
      }
    } catch (e) {
      // Processing failed — return the original file unchanged so upload still works
      console.error('[process-glb] processing failed, returning original:', e)
    }

    // Fallback: return original bytes
    return new Response(Buffer.from(inputBytes), {
      status: 200,
      headers: {
        'Content-Type': 'model/gltf-binary',
        'Content-Disposition': 'attachment; filename="model.glb"',
        'Content-Length': String(inputBytes.byteLength),
      },
    })
  } catch (e: any) {
    console.error('[process-glb] unhandled error:', e)
    return NextResponse.json({ error: e?.message ?? 'Internal server error' }, { status: 500 })
  }
}
