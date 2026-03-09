import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import '@/app/i18n'
import { ProfilePage } from './profile-page'
import { renderWithProviders } from '@/test/render-with-providers'
import type { AuthUser } from '@/features/auth/services/auth-api'

const mockUser: AuthUser = {
  id: 'user-1',
  name: 'Mahesh Yadav',
  email: 'mahesh@jalsoochak.com',
  role: 'state_admin',
  phoneNumber: '8564254517',
  tenantId: 'tenant-1',
  personId: 'person-1',
}

const mockUpdateUser = jest.fn()

jest.mock('@/app/store', () => ({
  useAuthStore: jest.fn((selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      user: mockUser,
      updateUser: mockUpdateUser,
    })
  ),
}))

jest.mock('@/features/auth/services/auth-api', () => ({
  authApi: {
    updateProfile: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  },
  buildUpdateProfileRequest: jest.fn().mockReturnValue({}),
}))

describe('ProfilePage — View Mode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders page title', () => {
    renderWithProviders(<ProfilePage />)
    expect(screen.getByRole('heading', { name: /profile/i, level: 1 })).toBeTruthy()
  })

  it('renders Profile Details section heading', () => {
    renderWithProviders(<ProfilePage />)
    expect(screen.getByText('Profile Details')).toBeTruthy()
  })

  it('displays split first and last name from user.name', () => {
    renderWithProviders(<ProfilePage />)
    expect(screen.getByText('Mahesh')).toBeTruthy()
    expect(screen.getByText('Yadav')).toBeTruthy()
  })

  it('displays email and phone', () => {
    renderWithProviders(<ProfilePage />)
    expect(screen.getByText('mahesh@jalsoochak.com')).toBeTruthy()
    expect(screen.getByText('8564254517')).toBeTruthy()
  })

  it('renders edit icon button', () => {
    renderWithProviders(<ProfilePage />)
    expect(screen.getByRole('button', { name: /edit profile/i })).toBeTruthy()
  })

  it('does not render form inputs in view mode', () => {
    renderWithProviders(<ProfilePage />)
    expect(screen.queryByLabelText(/first name/i)).toBeNull()
  })
})

describe('ProfilePage — Edit Mode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('switches to edit mode on edit button click', () => {
    renderWithProviders(<ProfilePage />)
    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))
    expect(screen.getByLabelText(/first name/i)).toBeTruthy()
    expect(screen.getByLabelText(/last name/i)).toBeTruthy()
    expect(screen.getByLabelText(/phone number/i)).toBeTruthy()
  })

  it('email field is disabled in edit mode', () => {
    renderWithProviders(<ProfilePage />)
    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))
    const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement
    expect(emailInput.disabled).toBe(true)
  })

  it('pre-fills first and last name from user.name', () => {
    renderWithProviders(<ProfilePage />)
    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))
    const firstNameInput = screen.getByLabelText(/first name/i) as HTMLInputElement
    const lastNameInput = screen.getByLabelText(/last name/i) as HTMLInputElement
    expect(firstNameInput.value).toBe('Mahesh')
    expect(lastNameInput.value).toBe('Yadav')
  })

  it('Save Changes button is disabled when no changes made', () => {
    renderWithProviders(<ProfilePage />)
    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))
    const saveBtn = screen.getByRole('button', { name: /save changes/i }) as HTMLButtonElement
    expect(saveBtn.disabled).toBe(true)
  })

  it('Save Changes button is enabled after making a change', () => {
    renderWithProviders(<ProfilePage />)
    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Rajesh' } })
    const saveBtn = screen.getByRole('button', { name: /save changes/i }) as HTMLButtonElement
    expect(saveBtn.disabled).toBe(false)
  })

  it('Cancel returns to view mode', () => {
    renderWithProviders(<ProfilePage />)
    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByLabelText(/first name/i)).toBeNull()
    expect(screen.getByText('Profile Details')).toBeTruthy()
  })

  it('calls updateProfile and updateUser on successful save', async () => {
    const { authApi } = await import('@/features/auth/services/auth-api')
    renderWithProviders(<ProfilePage />)
    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Rajesh' } })
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => {
      expect(authApi.updateProfile).toHaveBeenCalledTimes(1)
      expect(mockUpdateUser).toHaveBeenCalledTimes(1)
    })
  })
})
