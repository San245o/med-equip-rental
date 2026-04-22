'use client'

import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, History, Loader2, ShieldCheck } from 'lucide-react'
import { formatCurrency, formatDate, shortenHash } from '@/lib/utils'
import { ipfsGatewayUrl } from '@/lib/ipfs'

interface ListingHistoryPanelProps {
  currentCid?: string | null
  history?: string[] | null
}

interface ListingSnapshot {
  cid: string
  synced_at?: string
  snapshot_reason?: string
  name?: string
  description?: string | null
  brand?: string | null
  listing_type?: string
  condition?: string
  daily_rate?: number | null
  weekly_rate?: number | null
  monthly_rate?: number | null
  sale_price?: number | null
  year_manufactured?: number | null
  images?: string[]
  ipfs_image_cids?: string[]
  ipfs_image_urls?: string[]
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  description: 'Description',
  brand: 'Brand',
  listing_type: 'Listing type',
  condition: 'Condition',
  daily_rate: 'Daily rate',
  weekly_rate: 'Weekly rate',
  monthly_rate: 'Monthly rate',
  sale_price: 'Sale price',
  year_manufactured: 'Year manufactured',
  images: 'Images',
}

const TRACKED_FIELDS = [
  'name',
  'description',
  'brand',
  'listing_type',
  'condition',
  'daily_rate',
  'weekly_rate',
  'monthly_rate',
  'sale_price',
  'year_manufactured',
  'images',
] as const

function stringifyComparableValue(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value)
  if (value == null) return ''
  return String(value)
}

function formatSnapshotValue(field: string, value: unknown): string {
  if (value == null || value === '') return 'None'

  if (field === 'daily_rate' || field === 'weekly_rate' || field === 'monthly_rate' || field === 'sale_price') {
    return formatCurrency(Number(value))
  }

  if (field === 'images') {
    return `${Array.isArray(value) ? value.length : 0} image(s)`
  }

  if (field === 'listing_type') {
    if (value === 'rent') return 'For Rent'
    if (value === 'sell') return 'For Sale'
    if (value === 'both') return 'Rent + Sale'
  }

  return String(value)
}

function getSnapshotImages(snapshot: ListingSnapshot): string[] {
  if (Array.isArray(snapshot.ipfs_image_urls) && snapshot.ipfs_image_urls.length > 0) {
    return snapshot.ipfs_image_urls
  }

  if (Array.isArray(snapshot.ipfs_image_cids) && snapshot.ipfs_image_cids.length > 0) {
    return snapshot.ipfs_image_cids.map((cid) => ipfsGatewayUrl(cid))
  }

  return Array.isArray(snapshot.images) ? snapshot.images : []
}

function getSnapshotChanges(current: ListingSnapshot, previous?: ListingSnapshot) {
  if (!previous) {
    return [
      {
        label: 'Snapshot',
        description: 'Initial verified version published to IPFS.',
      },
    ]
  }

  const changes = TRACKED_FIELDS.flatMap((field) => {
    const currentValue = field === 'images' ? getSnapshotImages(current) : current[field]
    const previousValue = field === 'images' ? getSnapshotImages(previous) : previous[field]

    if (stringifyComparableValue(currentValue) === stringifyComparableValue(previousValue)) {
      return []
    }

    return [{
      label: FIELD_LABELS[field],
      description: `${formatSnapshotValue(field, previousValue)} -> ${formatSnapshotValue(field, currentValue)}`,
    }]
  })

  return changes.length > 0
    ? changes
    : [{
        label: 'Snapshot',
        description: 'Republished without a tracked field change.',
      }]
}

function buildOrderedHistory(currentCid?: string | null, history?: string[] | null) {
  const orderedNewestFirst: string[] = []
  const seen = new Set<string>()
  const historyValues = Array.isArray(history) ? [...history].reverse() : []
  const candidates = currentCid ? [currentCid, ...historyValues] : historyValues

  for (const cid of candidates) {
    if (!cid || seen.has(cid)) continue
    seen.add(cid)
    orderedNewestFirst.push(cid)
  }

  return orderedNewestFirst
}

export default function ListingHistoryPanel({ currentCid, history }: ListingHistoryPanelProps) {
  const orderedHistory = useMemo(
    () => buildOrderedHistory(currentCid, history),
    [currentCid, history]
  )
  const [snapshots, setSnapshots] = useState<ListingSnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadSnapshots() {
      if (orderedHistory.length === 0) {
        setSnapshots([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const results = await Promise.all(
          orderedHistory.map(async (cid) => {
            const response = await fetch(`/api/ipfs/listings/${cid}`)
            if (!response.ok) {
              throw new Error(`Failed to fetch listing snapshot ${cid}`)
            }

            return response.json() as Promise<ListingSnapshot>
          })
        )

        if (!cancelled) {
          setSnapshots(results)
        }
      } catch (snapshotError) {
        if (!cancelled) {
          setError(snapshotError instanceof Error ? snapshotError.message : 'Failed to load listing history')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadSnapshots()

    return () => {
      cancelled = true
    }
  }, [orderedHistory])

  if (!currentCid && orderedHistory.length === 0) {
    return null
  }

  return (
    <section className="bg-[#141414] rounded-xl border border-[#262626] p-6 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-500/10 text-teal-300 text-xs uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified on IPFS
          </div>
          <h3 className="text-lg font-semibold mt-3">Immutable Listing Snapshot</h3>
          <p className="text-sm text-[#737373] mt-1">
            Buyers can verify the current CID and review how this listing changed over time.
          </p>
        </div>

        {currentCid && (
          <a
            href={ipfsGatewayUrl(currentCid)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-teal-300 hover:text-teal-200 transition-colors"
          >
            {shortenHash(currentCid, 8, 6)}
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-[#737373]">
        <History className="w-4 h-4" />
        {orderedHistory.length} published version{orderedHistory.length === 1 ? '' : 's'}
      </div>

      {loading ? (
        <div className="flex items-center gap-3 rounded-xl border border-[#262626] bg-[#0f0f0f] px-4 py-6 text-sm text-[#737373]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading listing history...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm text-red-300">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          {snapshots.map((snapshot, index) => {
            const previousSnapshot = snapshots[index + 1]
            const changes = getSnapshotChanges(snapshot, previousSnapshot)

            return (
              <div key={snapshot.cid} className="rounded-xl border border-[#262626] bg-[#0f0f0f] p-4 space-y-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {index === 0 ? 'Current snapshot' : `Version ${snapshots.length - index}`}
                    </p>
                    <p className="text-xs text-[#737373] mt-1">
                      {snapshot.synced_at ? formatDate(snapshot.synced_at) : 'Pinned on IPFS'}
                      {snapshot.snapshot_reason ? ` · ${snapshot.snapshot_reason.replaceAll('_', ' ')}` : ''}
                    </p>
                  </div>
                  <a
                    href={ipfsGatewayUrl(snapshot.cid)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-teal-300 hover:text-teal-200 inline-flex items-center gap-2"
                  >
                    {shortenHash(snapshot.cid, 8, 6)}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="flex flex-wrap gap-2">
                  {changes.map((change) => (
                    <div key={`${snapshot.cid}-${change.label}`} className="px-3 py-2 rounded-lg bg-[#141414] border border-[#262626]">
                      <p className="text-[11px] uppercase tracking-wider text-[#737373]">{change.label}</p>
                      <p className="text-sm text-white mt-1">{change.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
