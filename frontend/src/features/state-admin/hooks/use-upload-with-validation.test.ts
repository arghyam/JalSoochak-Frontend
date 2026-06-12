import { renderHook, act } from '@testing-library/react'
import axios from 'axios'
import { useUploadWithValidation } from './use-upload-with-validation'

const mockToastSuccess = jest.fn()
const mockToastError = jest.fn()

jest.mock('@/shared/hooks/use-toast', () => ({
  useToast: () => ({
    toasts: [],
    removeToast: jest.fn(),
    success: mockToastSuccess,
    error: mockToastError,
    info: jest.fn(),
    warning: jest.fn(),
    addToast: jest.fn(),
  }),
}))

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

function buildMutation(mutate = jest.fn()) {
  return { mutate }
}

describe('useUploadWithValidation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls mutation.mutate with the provided file', () => {
    const mutate = jest.fn()
    const { result } = renderHook(() =>
      useUploadWithValidation({
        mutation: buildMutation(mutate),
        successMessage: 'Upload successful',
        errorMessage: 'Upload failed',
      })
    )

    const file = new File(['x'], 'test.xlsx')
    act(() => {
      result.current.handleUpload(file)
    })

    expect(mutate).toHaveBeenCalledWith(file, expect.any(Object))
  })

  it('shows success toast and calls onSuccess on mutation success', () => {
    const onSuccess = jest.fn()
    let capturedOnSuccess: (() => void) | undefined

    const mutate = jest.fn((_file: File, options: { onSuccess?: () => void }) => {
      capturedOnSuccess = options.onSuccess
    })

    const { result } = renderHook(() =>
      useUploadWithValidation({
        mutation: buildMutation(mutate),
        onSuccess,
        successMessage: 'Upload successful',
        errorMessage: 'Upload failed',
      })
    )

    act(() => {
      result.current.handleUpload(new File(['x'], 'test.xlsx'))
    })

    act(() => {
      capturedOnSuccess?.()
    })

    expect(mockToastSuccess).toHaveBeenCalledWith('Upload successful')
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('sets validationErrors when API returns validation errors', () => {
    let capturedOnError: ((error: unknown) => void) | undefined

    const mutate = jest.fn((_file: File, options: { onError?: (error: unknown) => void }) => {
      capturedOnError = options.onError
    })

    const { result } = renderHook(() =>
      useUploadWithValidation({
        mutation: buildMutation(mutate),
        successMessage: 'Upload successful',
        errorMessage: 'Upload failed',
      })
    )

    act(() => {
      result.current.handleUpload(new File(['x'], 'test.xlsx'))
    })

    const axiosError = {
      response: {
        data: {
          fieldErrors: [{ row: 2, field: 'name', message: 'Required' }],
        },
      },
    }
    mockedAxios.isAxiosError.mockReturnValue(true)

    act(() => {
      capturedOnError?.(axiosError)
    })

    expect(result.current.validationErrors).toEqual([
      { row: 2, field: 'name', message: 'Required' },
    ])
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it('shows error toast when API returns no structured validation errors', () => {
    let capturedOnError: ((error: unknown) => void) | undefined

    const mutate = jest.fn((_file: File, options: { onError?: (error: unknown) => void }) => {
      capturedOnError = options.onError
    })

    const { result } = renderHook(() =>
      useUploadWithValidation({
        mutation: buildMutation(mutate),
        successMessage: 'Upload successful',
        errorMessage: 'Upload failed',
      })
    )

    act(() => {
      result.current.handleUpload(new File(['x'], 'test.xlsx'))
    })

    const axiosError = { response: { data: {} } }
    mockedAxios.isAxiosError.mockReturnValue(true)

    act(() => {
      capturedOnError?.(axiosError)
    })

    expect(mockToastError).toHaveBeenCalledWith('Upload failed')
    expect(result.current.validationErrors).toEqual([])
  })

  it('clearErrors resets validationErrors to []', () => {
    let capturedOnError: ((error: unknown) => void) | undefined

    const mutate = jest.fn((_file: File, options: { onError?: (error: unknown) => void }) => {
      capturedOnError = options.onError
    })

    const { result } = renderHook(() =>
      useUploadWithValidation({
        mutation: buildMutation(mutate),
        successMessage: 'Upload successful',
        errorMessage: 'Upload failed',
      })
    )

    act(() => {
      result.current.handleUpload(new File(['x'], 'test.xlsx'))
    })

    mockedAxios.isAxiosError.mockReturnValue(true)
    act(() => {
      capturedOnError?.({
        response: {
          data: { fieldErrors: [{ row: 1, field: 'code', message: 'Invalid' }] },
        },
      })
    })

    expect(result.current.validationErrors).toHaveLength(1)

    act(() => {
      result.current.clearErrors()
    })

    expect(result.current.validationErrors).toEqual([])
  })
})
