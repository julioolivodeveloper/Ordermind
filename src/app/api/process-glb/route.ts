import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const maxDuration = 60

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max))

// Accepts JSON { url, path, widthCm?, heightCm?, targetCm? }
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body?.url || !body?.path) {
      return NextResponse.json({ error: 'Missing url or path' }, { status: 400 })
    }

    const { url, path, widthCm, heightCm, targetCm } = body as {
      url: string; path: string
      widthCm?: number; heightCm?: number; targetCm?: number
    }

    const targetW = clamp(widthCm  ?? targetCm ?? 18, 1, 300) / 100
    const targetH = clamp(heightCm ?? targetCm ?? 18, 1, 300) / 100

    // Download GLB
    const fetchRes = await fetch(url)
    if (!fetchRes.ok) {
      return NextResponse.json({ error: 'Could not download GLB' }, { status: 422 })
    }
    const arrayBuffer = await fetchRes.arrayBuffer()
    let uploadBytes: Uint8Array = new Uint8Array(arrayBuffer)

    // Rescale with gltf-transform
    try {
      const { NodeIO, getBounds } = await import('@gltf-transform/core')

      const io = new NodeIO()
      const document = await io.readBinary(uploadBytes)
      const root = document.getRoot()
      const scene = root.getDefaultScene() ?? root.listScenes()[0]

      if (scene) {
        const bounds = getBounds(scene)
        const modelW = bounds.max[0] - bounds.min[0]  // X axis = width
        const modelH = bounds.max[1] - bounds.min[1]  // Y axis = height
        const modelD = bounds.max[2] - bounds.min[2]  // Z axis = depth

        if (Math.max(modelW, modelH, modelD) > 0.0001) {
          // Non-uniform scale: X/Z to target width, Y to target height
          const sX = modelW > 0.0001 ? targetW / modelW : 1
          const sY = modelH > 0.0001 ? targetH / modelH : 1
          const sZ = modelD > 0.0001 ? targetW / modelD : 1  // depth follows width

          let targets = scene.listChildren()
          if (targets.length === 0) {
            targets = root.listNodes().filter(
              n => n.listParents().every(p => p === scene || p === root)
            )
          }

          for (const node of targets) {
            const [sx, sy, sz] = node.getScale()
            node.setScale([sx * sX, sy * sY, sz * sZ])
          }
        }

        uploadBytes = await io.writeBinary(document)
      }
    } catch (e) {
      console.error('[process-glb] gltf-transform failed:', e)
      return NextResponse.json({ error: 'GLB processing failed', detail: String(e) }, { status: 500 })
    }

    // Re-upload processed GLB
    const supabase = createAdminClient()
    const { error: storageError } = await supabase.storage
      .from('models')
      .upload(path, Buffer.from(uploadBytes), {
        upsert: true,
        contentType: 'model/gltf-binary',
      })

    if (storageError) {
      return NextResponse.json({ error: storageError.message }, { status: 500 })
    }

    const { data } = supabase.storage.from('models').getPublicUrl(path)
    return NextResponse.json({ url: data.publicUrl })
  } catch (e: any) {
    console.error('[process-glb] unhandled error:', e)
    return NextResponse.json({ error: e?.message ?? 'Internal server error' }, { status: 500 })
  }
}
