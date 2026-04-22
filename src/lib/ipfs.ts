export interface ListingIpfsPayload {
  equipmentId: number | string
  metadata: Record<string, unknown>
  images: File[]
  existingImages?: Array<{
    url: string
    cid?: string
  }>
}

export interface ListingIpfsResult {
  listingCid: string
  listingUrl: string
  imageCids: string[]
  imageUrls: string[]
}

export function ipfsGatewayUrl(cid: string): string {
  const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs'
  return `${gateway.replace(/\/$/, '')}/${cid}`
}

export async function uploadListingToIpfs(payload: ListingIpfsPayload): Promise<ListingIpfsResult> {
  const formData = new FormData()
  formData.append('equipmentId', String(payload.equipmentId))
  formData.append('metadata', JSON.stringify(payload.metadata))
  formData.append('existingImages', JSON.stringify(payload.existingImages || []))

  for (const image of payload.images) {
    formData.append('images', image)
  }

  const response = await fetch('/api/ipfs/listings', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(body?.error || 'Failed to upload listing to IPFS')
  }

  const body = await response.json() as ListingIpfsResult
  if (!body.listingCid || !Array.isArray(body.imageCids) || !Array.isArray(body.imageUrls)) {
    throw new Error('Invalid IPFS upload response')
  }

  return body
}
