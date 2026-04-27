import { NextResponse } from 'next/server'

const PINATA_FILE_ENDPOINT = 'https://api.pinata.cloud/pinning/pinFileToIPFS'
const PINATA_JSON_ENDPOINT = 'https://api.pinata.cloud/pinning/pinJSONToIPFS'

interface ExistingListingImage {
  url: string
  cid?: string
}

function getPinataHeaders(): Headers {
  const apiKey = process.env.PINATA_API_KEY
  const apiSecret = process.env.PINATA_API_SECRET
  const jwt = process.env.PINATA_JWT

  if (apiKey && apiSecret) {
    return new Headers({
      pinata_api_key: apiKey,
      pinata_secret_api_key: apiSecret,
    })
  }

  if (jwt) {
    return new Headers({
      Authorization: `Bearer ${jwt}`,
    })
  }

  throw new Error(
    'Pinata credentials are not configured. Set PINATA_JWT or PINATA_API_KEY and PINATA_API_SECRET.'
  )
}

function getGatewayBaseUrl(): string {
  const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs'
  return gateway.replace(/\/$/, '')
}

function getIpfsUrl(cid: string): string {
  return `${getGatewayBaseUrl()}/${cid}`
}

function getFileNameFromUrl(url: string, fallback: string): string {
  try {
    const parsed = new URL(url)
    const lastPathSegment = parsed.pathname.split('/').pop()
    return lastPathSegment || fallback
  } catch {
    return fallback
  }
}

async function pinFile(file: Blob, name: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file, name)
  formData.append('pinataMetadata', JSON.stringify({ name }))

  const response = await fetch(PINATA_FILE_ENDPOINT, {
    method: 'POST',
    headers: getPinataHeaders(),
    body: formData,
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to pin file to IPFS: ${body}`)
  }

  const body = await response.json() as { IpfsHash?: string }
  if (!body.IpfsHash) {
    throw new Error('Pinata did not return a file CID')
  }

  return body.IpfsHash
}

async function pinJson(payload: unknown, name: string): Promise<string> {
  const response = await fetch(PINATA_JSON_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getPinataHeaders(),
    },
    body: JSON.stringify({
      pinataMetadata: { name },
      pinataContent: payload,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to pin listing metadata: ${body}`)
  }

  const body = await response.json() as { IpfsHash?: string }
  if (!body.IpfsHash) {
    throw new Error('Pinata did not return a metadata CID')
  }

  return body.IpfsHash
}

async function pinRemoteImage(url: string, fallbackName: string): Promise<string> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch existing image for IPFS snapshot: ${url}`)
  }

  const contentType = response.headers.get('content-type') || 'image/webp'
  const buffer = await response.arrayBuffer()
  const blob = new Blob([buffer], { type: contentType })
  const fileName = getFileNameFromUrl(url, fallbackName)

  return pinFile(blob, fileName)
}

function parseExistingImages(value: FormDataEntryValue | null): ExistingListingImage[] {
  if (!value || typeof value !== 'string') return []

  try {
    const parsed = JSON.parse(value) as ExistingListingImage[]
    return Array.isArray(parsed)
      ? parsed.filter((image) => typeof image?.url === 'string' && image.url.length > 0)
      : []
  } catch {
    throw new Error('existingImages must be valid JSON')
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const equipmentId = String(formData.get('equipmentId') ?? '')
    const metadataRaw = String(formData.get('metadata') ?? '{}')
    const metadata = JSON.parse(metadataRaw) as Record<string, unknown>
    const images = formData.getAll('images').filter((value): value is File => value instanceof File)
    const existingImages = parseExistingImages(formData.get('existingImages'))

    if (!equipmentId) {
      return NextResponse.json({ error: 'equipmentId is required' }, { status: 400 })
    }

    const imageCids: string[] = []

    for (let index = 0; index < existingImages.length; index += 1) {
      const existingImage = existingImages[index]
      if (existingImage.cid) {
        imageCids.push(existingImage.cid)
        continue
      }

      const existingImageName = getFileNameFromUrl(
        existingImage.url,
        `equipment-${equipmentId}-image-${index + 1}.webp`
      )
      imageCids.push(await pinRemoteImage(existingImage.url, existingImageName))
    }

    for (let index = 0; index < images.length; index += 1) {
      const image = images[index]
      const imageName = `equipment-${equipmentId}-image-${existingImages.length + index + 1}.webp`
      imageCids.push(await pinFile(image, imageName))
    }

    const listingPayload = {
      ...metadata,
      ipfs_image_cids: imageCids,
      ipfs_image_urls: imageCids.map((cid) => getIpfsUrl(cid)),
      snapshot_type: 'equipment_listing',
      snapshot_version: 1,
      synced_at: new Date().toISOString(),
    }
    const listingCid = await pinJson(listingPayload, `equipment-${equipmentId}-metadata`)

    return NextResponse.json({
      listingCid,
      listingUrl: getIpfsUrl(listingCid),
      imageCids,
      imageUrls: imageCids.map((cid) => getIpfsUrl(cid)),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected IPFS upload error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
