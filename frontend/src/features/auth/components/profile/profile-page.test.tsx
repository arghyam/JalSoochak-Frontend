import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import '@/app/i18n'
import { ProfilePage } from './profile-page'
import { renderWithProviders } from '@/test/render-with-providers'
import type { MyProfileResponse } from '@/features/auth/services/auth-api'

const mockProfile: MyProfileResponse = {
  id: 10,
  email: 'mahesh@jalsoochak.com',
  firstName: 'Mahesh',
  lastName: 'Yadav',
  phoneNumber: '8564254517',
  role: 'STATE_ADMIN',
  tenantCode: 'TC001',
  active: true,
  createdAt: '2026-03-12T10:47:43.622177',
}

const mockMutate = jest.fn()

jest.mock('@/features/auth/services/query/use-auth-queries', () => ({
  useMyProfileQuery: jest.fn(),
  useUpdateMyProfileMutation: jest.fn(),
}))

import {
  useMyProfileQuery,
  useUpdateMyProfileMutation,
} from '@/features/auth/services/query/use-auth-queries'

const mockUseMyProfileQuery = useMyProfileQuery as jest.MockedFunction<typeof useMyProfileQuery>
const mockUseUpdateMyProfileMutation = useUpdateMyProfileMutation as jest.MockedFunction<
  typeof useUpdateMyProfileMutation
>

function setupLoaded(isPending = false) {
  mockUseMyProfileQuery.mockReturnValue({
    data: mockProfile,
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useMyProfileQuery>)
  mockUseUpdateMyProfileMutation.mockReturnValue({
    mutate: mockMutate,
    isPending,
  } as unknown as ReturnType<typeof useUpdateMyProfileMutation>)
}

describe('ProfilePage — Loading state', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseMyProfileQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useMyProfileQuery>)
    mockUseUpdateMyProfileMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateMyProfileMutation>)
  })

  it('does not render edit button while loading', () => {
    renderWithProviders(<ProfilePage />)
    expect(screen.queryByRole('button', { name: /edit profile/i })).toBeNull()
  })
})

describe('ProfilePage — Error state', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseMyProfileQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof useMyProfileQuery>)
    mockUseUpdateMyProfileMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateMyProfileMutation>)
  })

  it('renders error alert when query fails', () => {
    renderWithProviders(<ProfilePage />)
    expect(screen.getByRole('alert')).toBeTruthy()
  })

  it('does not render edit button on error', () => {
    renderWithProviders(<ProfilePage />)
    expect(screen.queryByRole('button', { name: /edit profile/i })).toBeNull()
  })
})

describe('ProfilePage — View Mode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupLoaded()
  })

  it('renders page title', () => {
    renderWithProviders(<ProfilePage />)
    expect(screen.getByRole('heading', { name: /profile/i, level: 1 })).toBeTruthy()
  })

  it('renders Profile Details section heading', () => {
    renderWithProviders(<ProfilePage />)
    expect(screen.getByText('Profile Details')).toBeTruthy()
  })

  it('displays firstName, lastName, email, and phone from query data', () => {
    renderWithProviders(<ProfilePage />)
    expect(screen.getByText('Mahesh')).toBeTruthy()
    expect(screen.getByText('Yadav')).toBeTruthy()
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
    setupLoaded()
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
    expect((screen.getByLabelText(/email address/i) as HTMLInputElement).disabled).toBe(true)
  })

  it('pre-fills form fields from query data', () => {
    renderWithProviders(<ProfilePage />)
    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))
    expect((screen.getByLabelText(/first name/i) as HTMLInputElement).value).toBe('Mahesh')
    expect((screen.getByLabelText(/last name/i) as HTMLInputElement).value).toBe('Yadav')
  })

  it('Save Changes button is disabled when no changes made', () => {
    renderWithProviders(<ProfilePage />)
    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))
    expect(
      (screen.getByRole('button', { name: /save changes/i }) as HTMLButtonElement).disabled
    ).toBe(true)
  })

  it('Save Changes button is enabled after making a change', () => {
    renderWithProviders(<ProfilePage />)
    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Rajesh' } })
    expect(
      (screen.getByRole('button', { name: /save changes/i }) as HTMLButtonElement).disabled
    ).toBe(false)
  })

  it('Cancel returns to view mode', () => {
    renderWithProviders(<ProfilePage />)
    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByLabelText(/first name/i)).toBeNull()
    expect(screen.getByText('Profile Details')).toBeTruthy()
  })

  it('calls mutation on save with trimmed values', async () => {
    renderWithProviders(<ProfilePage />)
    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Rajesh' } })
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        { firstName: 'Rajesh', lastName: 'Yadav', phoneNumber: '8564254517' },
        expect.any(Object)
      )
    })
  })

  it('save button is disabled while mutation is pending', () => {
    setupLoaded(true)
    renderWithProviders(<ProfilePage />)
    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Rajesh' } })
    expect(
      (screen.getByRole('button', { name: /save changes/i }) as HTMLButtonElement).disabled
    ).toBe(true)
  })
})
