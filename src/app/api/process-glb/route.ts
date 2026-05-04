import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const maxDuration = 60

const TARGET_METERS = 0.15

// Accepts JSON { url, path } — downloads GLB from url, rescales, re-uploads to same path
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body?.url || !body?.path) {
      return NextResponse.json({ error: 'Missing url or path' }, { status: 400 })
    }

    const { url, path } = body as { url: string; path: string }

    // Download GLB from Supabase public URL
    const fetchRes = await fetch(url)
    if (!fetchRes.ok) {
      return NextResponse.json({ error: 'Could not download GLB' }, { status: 422 })
    }
    const arrayBuffer = await fetchRes.arrayBuffer()
    let uploadBytes: Uint8Array = new Uint8Array(arrayBuffer)

    // Rescale with gltf-transform
    try {
      const { NodeIO, getBounds } = await import('@gltf-transform/core')
      const { center } = await import('@gltf-transform/functions')

      const io = new NodeIO()
      const document = await io.readBinary(uploadBytes)
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

        uploadBytes = await io.writeBinary(document)
      }
    } catch (e) {
      console.error('[process-glb] gltf-transform failed:', e)
      return NextResponse.json({ error: 'GLB processing failed', detail: String(e) }, { status: 500 })
    }

    // Re-upload processed GLB to same path (overwrites original)
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
