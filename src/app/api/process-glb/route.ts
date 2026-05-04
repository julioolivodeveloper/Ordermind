import { NodeIO, getBounds } from '@gltf-transform/core'
import { center } from '@gltf-transform/functions'
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

    const io = new NodeIO()
    let document

    try {
      document = await io.readBinary(inputBytes)
    } catch (e) {
      console.error('[process-glb] readBinary failed:', e)
      return NextResponse.json({ error: 'Could not parse GLB file' }, { status: 422 })
    }

    const root = document.getRoot()
    const scene = root.getDefaultScene() ?? root.listScenes()[0]

    if (!scene) {
      return NextResponse.json({ error: 'GLB has no scene' }, { status: 422 })
    }

    try {
      await document.transform(center({ pivot: 'below' }))
    } catch (e) {
      console.error('[process-glb] center transform failed:', e)
      return NextResponse.json({ error: 'Transform failed' }, { status: 500 })
    }

    const bounds = getBounds(scene)
    const dx = bounds.max[0] - bounds.min[0]
    const dy = bounds.max[1] - bounds.min[1]
    const dz = bounds.max[2] - bounds.min[2]
    const maxDim = Math.max(dx, dy, dz)

    if (maxDim > 0 && Math.abs(maxDim - TARGET_METERS) > 0.001) {
      const s = TARGET_METERS / maxDim
      for (const node of scene.listChildren()) {
        const [sx, sy, sz] = node.getScale()
        node.setScale([sx * s, sy * s, sz * s])
      }
    }

    let outputBytes: Uint8Array
    try {
      outputBytes = await io.writeBinary(document)
    } catch (e) {
      console.error('[process-glb] writeBinary failed:', e)
      return NextResponse.json({ error: 'Could not write GLB' }, { status: 500 })
    }

    return new Response(Buffer.from(outputBytes), {
      status: 200,
      headers: {
        'Content-Type': 'model/gltf-binary',
        'Content-Disposition': 'attachment; filename="model.glb"',
        'Content-Length': String(outputBytes.byteLength),
      },
    })
  } catch (e: any) {
    console.error('[process-glb] unhandled error:', e)
    return NextResponse.json({ error: e?.message ?? 'Internal server error' }, { status: 500 })
  }
}
