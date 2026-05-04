import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
    const restaurantId = formData.get('restaurantId') as string | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!restaurantId) return NextResponse.json({ error: 'No restaurantId provided' }, { status: 400 })
    if (!file.name.toLowerCase().endsWith('.glb')) {
      return NextResponse.json({ error: 'File must be a .glb' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    let uploadBytes: Uint8Array = new Uint8Array(arrayBuffer)

    // Try to rescale with gltf-transform; fall back to original on any error
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
      console.error('[process-glb] gltf-transform failed, uploading original:', e)
    }

    // Upload to Supabase Storage using service role key (bypasses RLS)
    const supabase = createAdminClient()
    const path = `${restaurantId}/${Date.now()}.glb`
    const { error: storageError } = await supabase.storage
      .from('models')
      .upload(path, Buffer.from(uploadBytes), {
        upsert: true,
        contentType: 'model/gltf-binary',
      })

    if (storageError) {
      console.error('[process-glb] storage upload failed:', storageError)
      return NextResponse.json({ error: storageError.message }, { status: 500 })
    }

    const { data } = supabase.storage.from('models').getPublicUrl(path)
    return NextResponse.json({ url: data.publicUrl })
  } catch (e: any) {
    console.error('[process-glb] unhandled error:', e)
    return NextResponse.json({ error: e?.message ?? 'Internal server error' }, { status: 500 })
  }
}
