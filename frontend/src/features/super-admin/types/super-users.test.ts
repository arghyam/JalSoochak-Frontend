import { describe, expect, it } from '@jest/globals'
import { mapApiUserToUserAdminData, type ApiUser } from './super-users'

function buildUser(overrides: Partial<ApiUser> = {}): ApiUser {
  return {
    id: 9,
    email: 'a@b.com',
    firstName: 'Ann',
    lastName: 'Bee',
    phoneNumber: '999',
    role: 'SUPER_USER',
    tenantCode: null,
    status: 'ACTIVE',
    createdAt: '2026-01-01',
    ...overrides,
  }
}

describe('mapApiUserToUserAdminData', () => {
  it('maps ACTIVE to active', () => {
    expect(mapApiUserToUserAdminData(buildUser())).toEqual({
      id: '9',
      firstName: 'Ann',
      lastName: 'Bee',
      email: 'a@b.com',
      phone: '999',
      status: 'active',
    })
  })

  it('maps PENDING and INACTIVE statuses', () => {
    expect(mapApiUserToUserAdminData(buildUser({ status: 'PENDING' })).status).toBe('pending')
    expect(mapApiUserToUserAdminData(buildUser({ status: 'INACTIVE' })).status).toBe('inactive')
  })

  it('uses empty strings when names are null', () => {
    const mapped = mapApiUserToUserAdminData(buildUser({ firstName: null, lastName: null }))
    expect(mapped.firstName).toBe('')
    expect(mapped.lastName).toBe('')
  })
})
