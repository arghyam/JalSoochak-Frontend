import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { useFileDownload } from './use-file-download'

type MockFetch = jest.MockedFunction<typeof globalThis.fetch>

const mockFetch = jest.fn() as unknown as MockFetch
const mockCreateObjectURL = jest.fn().mockReturnValue('blob:mock') as jest.Mock<() => string>
const mockRevokeObjectURL = jest.fn()

function makeFetchResponse(ok: boolean, contentType: string | null, blob: () => Promise<Blob>) {
  return {
    ok,
    status: ok ? 200 : 404,
    headers: { get: (h: string) => (h === 'content-type' ? contentType : null) },
    blob,
  } as unknown as Response
}

describe('useFileDownload', () => {
  let clickSpy: ReturnType<typeof jest.spyOn>
  let appendSpy: ReturnType<typeof jest.spyOn>

  beforeEach(() => {
    jest.clearAllMocks()
    ;(globalThis as { fetch: unknown }).fetch = mockFetch
    ;(URL as { createObjectURL: unknown }).createObjectURL = mockCreateObjectURL
    ;(URL as { revokeObjectURL: unknown }).revokeObjectURL = mockRevokeObjectURL
    clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    appendSpy = jest.spyOn(document.body, 'appendChild')
  })

  afterEach(() => {
    clickSpy.mockRestore()
    appendSpy.mockRestore()
  })

  // ── 1. isDownloading lifecycle ────────────────────────────────────────────────

  it('sets isDownloading to true during download and false after completion', async () => {
    // Defer fetch so download() suspends at await fetch() and we can observe isDownloading=true
    let resolveFetch!: (r: Response) => void
    mockFetch.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve
        })
    )

    const { result } = renderHook(() =>
      useFileDownload({
        getDownloadUrl: () => 'https://example.com/file.csv',
        filename: 'test.csv',
      })
    )

    expect(result.current.isDownloading).toBe(false)

    // setIsDownloading(true) fires synchronously before the first await
    let downloadPromise!: Promise<void>
    act(() => {
      downloadPromise = result.current.download()
    })

    expect(result.current.isDownloading).toBe(true)

    // Flush the await-getDownloadUrl() microtask so download() advances and calls fetch()
    // After this, resolveFetch is assigned and download() is suspended at await fetch()
    await act(async () => {})

    expect(result.current.isDownloading).toBe(true)

    // Resolve fetch and complete the download
    await act(async () => {
      resolveFetch(
        makeFetchResponse(true, 'text/csv', () =>
          Promise.resolve(new Blob(['csv'], { type: 'text/csv' }))
        )
      )
      try {
        await downloadPromise
      } catch {
        /* re-throw expected; onError handles feedback */
      }
    })

    expect(result.current.isDownloading).toBe(false)
  })

  // ── 2. onError — non-ok HTTP status ──────────────────────────────────────────

  it('calls onError when fetch returns non-ok status', async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve(makeFetchResponse(false, null, () => Promise.resolve(new Blob())))
    )
    const onError = jest.fn()

    const { result } = renderHook(() =>
      useFileDownload({
        getDownloadUrl: () => 'https://example.com/file.csv',
        filename: 'test.csv',
        onError,
      })
    )

    await act(async () => {
      try {
        await result.current.download()
      } catch {
        /* re-throw expected; onError handles feedback */
      }
    })

    expect(onError).toHaveBeenCalledWith(expect.any(Error))
    expect(result.current.isDownloading).toBe(false)
  })

  // ── 3. onError — invalid content-type ────────────────────────────────────────

  it('calls onError when content-type is invalid', async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve(makeFetchResponse(true, 'text/html', () => Promise.resolve(new Blob())))
    )
    const onError = jest.fn()

    const { result } = renderHook(() =>
      useFileDownload({
        getDownloadUrl: () => 'https://example.com/file.csv',
        filename: 'test.csv',
        onError,
      })
    )

    await act(async () => {
      try {
        await result.current.download()
      } catch {
        /* re-throw expected; onError handles feedback */
      }
    })

    expect(onError).toHaveBeenCalledWith(expect.any(Error))
    expect(result.current.isDownloading).toBe(false)
  })

  // ── 4. onError — blob exceeds size limit ─────────────────────────────────────

  it('calls onError when blob exceeds size limit', async () => {
    const oversizedBlob = new Blob([new Uint8Array(51 * 1024 * 1024)], { type: 'text/csv' })
    mockFetch.mockImplementation(() =>
      Promise.resolve(makeFetchResponse(true, 'text/csv', () => Promise.resolve(oversizedBlob)))
    )
    const onError = jest.fn()

    const { result } = renderHook(() =>
      useFileDownload({
        getDownloadUrl: () => 'https://example.com/file.csv',
        filename: 'test.csv',
        onError,
      })
    )

    await act(async () => {
      try {
        await result.current.download()
      } catch {
        /* re-throw expected; onError handles feedback */
      }
    })

    expect(onError).toHaveBeenCalledWith(expect.any(Error))
    expect(result.current.isDownloading).toBe(false)
  })

  // ── 5. Anchor created with correct filename, click triggered ─────────────────

  it('creates an anchor with the correct filename and triggers click on success', async () => {
    const csvBlob = new Blob(['csv'], { type: 'text/csv' })
    mockFetch.mockImplementation(() =>
      Promise.resolve(makeFetchResponse(true, 'text/csv', () => Promise.resolve(csvBlob)))
    )
    mockCreateObjectURL.mockReturnValue('blob:test-url')

    const { result } = renderHook(() =>
      useFileDownload({
        getDownloadUrl: () => 'https://example.com/file.csv',
        filename: 'my-report.csv',
      })
    )

    await act(async () => {
      await result.current.download()
    })

    const anchor = (appendSpy.mock.calls as Array<[Node]>)
      .map((c) => c[0] as HTMLElement)
      .find((el) => el.tagName === 'A') as HTMLAnchorElement | undefined

    expect(anchor).toBeDefined()
    expect(anchor!.download).toBe('my-report.csv')
    expect(anchor!.href).toBe('blob:test-url')
    expect(clickSpy).toHaveBeenCalled()
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url')
  })
})
