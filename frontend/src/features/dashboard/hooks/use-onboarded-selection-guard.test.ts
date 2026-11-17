import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { LocationSelectionLevel } from '../utils/dashboard-level'
import type { OnboardedPredicate, OnboardedPredicatesByLevel } from '../utils/onboarded-regions'
import { useOnboardedSelectionGuard } from './use-onboarded-selection-guard'

type GuardProps = Parameters<typeof useOnboardedSelectionGuard>[0]

const noSelections: Record<LocationSelectionLevel, string> = {
  district: '',
  block: '',
  gramPanchayat: '',
  village: '',
  departmentZone: '',
  departmentCircle: '',
  departmentDivision: '',
  departmentSubdivision: '',
  departmentVillage: '',
}

const onboardedIds =
  (...ids: number[]): OnboardedPredicate =>
  (id) =>
    typeof id === 'number' && ids.includes(id)

describe('useOnboardedSelectionGuard', () => {
  const clearSelectionFrom = jest.fn<(level: LocationSelectionLevel) => void>()

  const renderGuard = (
    selections: Partial<Record<LocationSelectionLevel, string>>,
    isOnboardedByLevel: OnboardedPredicatesByLevel,
    hierarchyType: GuardProps['hierarchyType'] = 'LGD'
  ) =>
    renderHook<void, GuardProps>((props) => useOnboardedSelectionGuard(props), {
      initialProps: {
        hierarchyType,
        selections: { ...noSelections, ...selections },
        isOnboardedByLevel,
        clearSelectionFrom,
      },
    })

  beforeEach(() => {
    clearSelectionFrom.mockReset()
  })

  it('clears a deep-linked district that is not onboarded', () => {
    renderGuard({ district: '13:13:ludhiana' }, { district: onboardedIds(12) })

    expect(clearSelectionFrom).toHaveBeenCalledTimes(1)
    expect(clearSelectionFrom).toHaveBeenCalledWith('district')
  })

  it('clears from the shallowest level that is not onboarded', () => {
    renderGuard(
      { district: '12:12:amritsar', block: '121:121:ajnala', gramPanchayat: '1201:1201:gp' },
      {
        district: onboardedIds(12),
        block: onboardedIds(122),
        gramPanchayat: onboardedIds(),
      }
    )

    expect(clearSelectionFrom).toHaveBeenCalledTimes(1)
    expect(clearSelectionFrom).toHaveBeenCalledWith('block')
  })

  it('keeps selections that are onboarded', () => {
    renderGuard(
      { district: '12:12:amritsar', block: '121:121:ajnala' },
      { district: onboardedIds(12), block: onboardedIds(121) }
    )

    expect(clearSelectionFrom).not.toHaveBeenCalled()
  })

  it('does nothing while a level is unresolved, including the levels below it', () => {
    renderGuard(
      { district: '13:13:ludhiana', block: '131:131:doraha' },
      { district: undefined, block: onboardedIds() }
    )

    expect(clearSelectionFrom).not.toHaveBeenCalled()
  })

  it('clears a selection that carries no id', () => {
    renderGuard({ district: 'ludhiana' }, { district: onboardedIds(12) })

    expect(clearSelectionFrom).toHaveBeenCalledWith('district')
  })

  it('clears a department zone that is not onboarded on the departmental hierarchy', () => {
    renderGuard(
      { district: '13:13:ludhiana', departmentZone: '7:7:north-zone' },
      { departmentZone: onboardedIds(8) },
      'DEPARTMENT'
    )

    expect(clearSelectionFrom).toHaveBeenCalledTimes(1)
    expect(clearSelectionFrom).toHaveBeenCalledWith('departmentZone')
  })

  it('checks only the active hierarchy', () => {
    renderGuard(
      { district: '12:12:amritsar', departmentZone: '7:7:north-zone' },
      { district: onboardedIds(12) }
    )

    expect(clearSelectionFrom).not.toHaveBeenCalled()
  })

  it('clears a selection once while the URL catches up, and again if it comes back', () => {
    const isOnboardedByLevel = { district: onboardedIds(12) }
    const blocked = { ...noSelections, district: '13:13:ludhiana' }
    // A new function each render, as the unmemoised filters hook hands over.
    const rerenderWith = (selections: Record<LocationSelectionLevel, string>) =>
      rerender({
        hierarchyType: 'LGD',
        selections,
        isOnboardedByLevel,
        clearSelectionFrom: (level) => clearSelectionFrom(level),
      })
    const { rerender } = renderGuard(blocked, isOnboardedByLevel)

    rerenderWith(blocked)
    expect(clearSelectionFrom).toHaveBeenCalledTimes(1)

    rerenderWith(noSelections)
    rerenderWith(blocked)
    expect(clearSelectionFrom).toHaveBeenCalledTimes(2)
  })
})
