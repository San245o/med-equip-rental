import { NextResponse } from 'next/server'

function getGatewayBaseUrl(): string {
  const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs'
  return gateway.replace(/\/$/, '')
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cid: string }> }
) {
  try {
    const { cid } = await params

    if (!cid) {
      return NextResponse.json({ error: 'cid is required' }, { status: 400 })
    }

    const response = await fetch(`${getGatewayBaseUrl()}/${cid}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch IPFS snapshot ${cid}` },
        { status: response.status }
      )
    }

    const body = await response.json() as Record<string, unknown>
    return NextResponse.json({
      cid,
      ...body,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected IPFS fetch error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
