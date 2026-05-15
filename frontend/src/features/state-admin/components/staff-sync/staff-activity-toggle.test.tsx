import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import { StaffActivityToggle } from './staff-activity-toggle'
import { renderWithProviders } from '@/test/render-with-providers'

const mockMutateAsync =
  jest.fn<
    (args: { id: number; status: 'ACTIVE' | 'INACTIVE'; tenantCode: string }) => Promise<void>
  >()

jest.mock('../../services/query/use-state-admin-queries', () => ({
  useUpdateStaffStatusMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}))

describe('StaffActivityToggle', () => {
  const onSuccess = jest.fn()
  const onError = jest.fn()

  beforeEach(() => {
    mockMutateAsync.mockReset()
    mockMutateAsync.mockResolvedValue(undefined)
    onSuccess.mockReset()
    onError.mockReset()
  })

  it('renders checked toggle for active staff', () => {
    renderWithProviders(
      <StaffActivityToggle
        staffId={1}
        status="ACTIVE"
        tenantCode="AS"
        onSuccess={onSuccess}
        onError={onError}
      />
    )
    const toggle = screen.getByRole('checkbox')
    expect(toggle).toBeTruthy()
    expect((toggle as HTMLInputElement).checked).toBe(true)
  })

  it('renders unchecked toggle for inactive staff', () => {
    renderWithProviders(
      <StaffActivityToggle
        staffId={2}
        status="INACTIVE"
        tenantCode="AS"
        onSuccess={onSuccess}
        onError={onError}
      />
    )
    const toggle = screen.getByRole('checkbox')
    expect((toggle as HTMLInputElement).checked).toBe(false)
  })

  it('calls deactivate API when toggling active staff off', async () => {
    renderWithProviders(
      <StaffActivityToggle
        staffId={27935}
        status="ACTIVE"
        tenantCode="AS"
        onSuccess={onSuccess}
        onError={onError}
      />
    )
    fireEvent.click(screen.getByRole('checkbox'))
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        id: 27935,
        status: 'INACTIVE',
        tenantCode: 'AS',
      })
    })
    expect(onSuccess).toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })

  it('calls activate API when toggling inactive staff on', async () => {
    renderWithProviders(
      <StaffActivityToggle
        staffId={27934}
        status="INACTIVE"
        tenantCode="AS"
        onSuccess={onSuccess}
        onError={onError}
      />
    )
    fireEvent.click(screen.getByRole('checkbox'))
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        id: 27934,
        status: 'ACTIVE',
        tenantCode: 'AS',
      })
    })
    expect(onSuccess).toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })

  it('calls onError when mutation fails', async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error('failed'))
    renderWithProviders(
      <StaffActivityToggle
        staffId={1}
        status="ACTIVE"
        tenantCode="AS"
        onSuccess={onSuccess}
        onError={onError}
      />
    )
    fireEvent.click(screen.getByRole('checkbox'))
    await waitFor(() => {
      expect(onError).toHaveBeenCalled()
    })
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
