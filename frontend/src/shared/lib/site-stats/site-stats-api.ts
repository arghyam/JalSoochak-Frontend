/**
 * Firestore REST client for the public visitor counter.
 *
 * Uses the REST API rather than `firebase/firestore` because the SDK costs ~250 KB for what
 * is one read and one atomic increment against a single document.
 *
 * The document is `siteStats/visitors` with a single numeric `count` field. Its security
 * rules allow an unauthenticated `get`, and an `update` only when it changes `count` alone
 * and by exactly +1 — which is why the write below is an `increment` field transform rather
 * than a read-modify-write.
 */

import axios, { type AxiosInstance } from 'axios'
import { getFirebaseConfig } from '@/config/server-config'

const FIRESTORE_BASE_URL = 'https://firestore.googleapis.com/v1'
const COLLECTION_ID = 'siteStats'
const DOCUMENT_ID = 'visitors'
const COUNT_FIELD = 'count'

/**
 * Marks the current tab session as counted. Sessions rather than page loads, so a reload
 * does not inflate the number.
 */
const VISIT_FLAG_KEY = 'jalsoochak:visitor-counted'

/** Raised for every failure path so callers never surface a raw Firestore message. */
export class SiteStatsError extends Error {
  readonly reason?: unknown

  constructor(message: string, reason?: unknown) {
    super(message)
    this.name = 'SiteStatsError'
    this.reason = reason
  }
}

interface FirestoreDocumentResponse {
  fields?: {
    count?: {
      /** Firestore returns 64-bit integers as strings to survive JSON. */
      integerValue?: string
      doubleValue?: number
    }
  }
}

/**
 * A bare axios instance, deliberately not the shared `apiClient`/`publicApiClient`: those
 * are bound to `API_BASE_URL` and attach auth headers plus a 401-refresh interceptor that
 * must never fire against googleapis.com.
 */
let client: AxiosInstance | null = null

function getClient(): AxiosInstance {
  client ??= axios.create({ baseURL: FIRESTORE_BASE_URL, timeout: 10_000 })
  return client
}

function requireConfig(): { projectId: string; apiKey: string } {
  const config = getFirebaseConfig()
  if (!config?.projectId || !config.apiKey) {
    throw new SiteStatsError('Visitor counter is not configured.')
  }
  return { projectId: config.projectId, apiKey: config.apiKey }
}

function toDocumentPath(projectId: string): string {
  return `projects/${projectId}/databases/(default)/documents/${COLLECTION_ID}/${DOCUMENT_ID}`
}

function toRelativeDocumentUrl(): string {
  return `/${COLLECTION_ID}/${DOCUMENT_ID}`
}

function toDocumentsUrl(projectId: string): string {
  return `/projects/${projectId}/databases/(default)/documents`
}

/** Reads the current count. */
export async function getVisitorCount(): Promise<number> {
  const { projectId, apiKey } = requireConfig()

  try {
    const { data } = await getClient().get<FirestoreDocumentResponse>(
      `${toDocumentsUrl(projectId)}${toRelativeDocumentUrl()}`,
      { params: { key: apiKey } }
    )

    const field = data.fields?.count
    const parsed =
      field?.integerValue !== undefined ? Number(field.integerValue) : field?.doubleValue

    if (parsed === undefined || !Number.isFinite(parsed)) {
      throw new SiteStatsError('Visitor count is missing or malformed.')
    }

    return parsed
  } catch (error) {
    if (error instanceof SiteStatsError) throw error
    throw new SiteStatsError('Could not read the visitor count.', error)
  }
}

/**
 * Atomically bumps the count by one.
 *
 * An `increment` transform rather than a read-then-write: it cannot lose updates under
 * concurrency, and it is what the +1 security rule is written against.
 */
export async function incrementVisitorCount(): Promise<void> {
  const { projectId, apiKey } = requireConfig()

  try {
    await getClient().post(
      `${toDocumentsUrl(projectId)}:commit`,
      {
        writes: [
          {
            transform: {
              document: toDocumentPath(projectId),
              fieldTransforms: [{ fieldPath: COUNT_FIELD, increment: { integerValue: '1' } }],
            },
          },
        ],
      },
      { params: { key: apiKey } }
    )
  } catch (error) {
    throw new SiteStatsError('Could not record the visit.', error)
  }
}

function hasCountedThisSession(): boolean {
  try {
    return sessionStorage.getItem(VISIT_FLAG_KEY) === '1'
  } catch {
    // Private modes and blocked storage: treat as counted so a visitor who cannot be
    // tracked is never counted repeatedly.
    return true
  }
}

function markCountedThisSession(): void {
  try {
    sessionStorage.setItem(VISIT_FLAG_KEY, '1')
  } catch {
    // Nothing to do — the read guard above already fails closed.
  }
}

/**
 * Counts this session if it has not been counted yet, then returns the current count.
 *
 * The flag is written *before* the increment on purpose: if the write fails or a retry
 * fires it twice, the session is never double-counted. Losing a visit is preferable to
 * inflating a public number.
 */
export async function registerVisitAndGetCount(): Promise<number> {
  if (!hasCountedThisSession()) {
    markCountedThisSession()
    try {
      await incrementVisitorCount()
    } catch {
      // A failed increment must not stop the counter from displaying.
    }
  }

  return getVisitorCount()
}

/** Test-only: drops the memoised axios instance. */
export function resetSiteStatsClientForTesting(): void {
  client = null
}
