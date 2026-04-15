import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { useState } from 'react'
import type { SearchableSelectOption } from '@/shared/components/common'
import { renderWithProviders } from '@/test/render-with-providers'
import { DashboardFilters } from './dashboard-filters'

const emptyOptions: SearchableSelectOption[] = []
const mockUseLocationSearchQuery = jest.fn()
const mockUseLocationHierarchyQuery = jest.fn()
const mockUseLocationChildrenQuery = jest.fn()

jest.mock('../../services/query/use-location-search-query', () => ({
  useLocationSearchQuery: (...args: unknown[]) => mockUseLocationSearchQuery(...args),
}))

jest.mock('../../services/query/use-location-hierarchy-query', () => ({
  useLocationHierarchyQuery: (...args: unknown[]) => mockUseLocationHierarchyQuery(...args),
}))

jest.mock('../../services/query/use-location-children-query', () => ({
  useLocationChildrenQuery: (...args: unknown[]) => mockUseLocationChildrenQuery(...args),
}))

describe('DashboardFilters', () => {
  beforeEach(() => {
    mockUseLocationSearchQuery.mockReturnValue({
      data: {
        totalStatesCount: 36,
        states: [{ value: 'telangana', label: 'Telangana' }],
      },
    })
    mockUseLocationHierarchyQuery.mockReturnValue({ data: undefined })
    mockUseLocationChildrenQuery.mockReturnValue({ data: undefined })
  })

  it('keeps duration control enabled even when advanced filters are disabled', () => {
    renderWithProviders(
      <DashboardFilters
        filterTabIndex={1}
        onTabChange={jest.fn()}
        onClear={jest.fn()}
        isAdvancedEnabled={false}
        isDepartmentStateSelected={false}
        emptyOptions={emptyOptions}
        selectedState=""
        selectedDistrict=""
        selectedBlock=""
        selectedGramPanchayat=""
        selectedVillage=""
        selectedScheme=""
        selectedDuration={null}
        selectedDepartmentState=""
        selectedDepartmentZone=""
        selectedDepartmentCircle=""
        selectedDepartmentDivision=""
        selectedDepartmentSubdivision=""
        selectedDepartmentVillage=""
        districtOptions={emptyOptions}
        blockOptions={emptyOptions}
        gramPanchayatOptions={emptyOptions}
        villageOptions={emptyOptions}
        mockFilterStates={emptyOptions}
        mockFilterSchemes={emptyOptions}
        onStateChange={jest.fn()}
        onDistrictChange={jest.fn()}
        onBlockChange={jest.fn()}
        onGramPanchayatChange={jest.fn()}
        setSelectedVillage={jest.fn()}
        setSelectedScheme={jest.fn()}
        setSelectedDuration={jest.fn()}
        onDepartmentStateChange={jest.fn()}
        setSelectedDepartmentZone={jest.fn()}
        setSelectedDepartmentCircle={jest.fn()}
        setSelectedDepartmentDivision={jest.fn()}
        setSelectedDepartmentSubdivision={jest.fn()}
        setSelectedDepartmentVillage={jest.fn()}
      />
    )

    const durationButton = screen.getByRole('button', { name: 'Duration' })
    fireEvent.click(durationButton)

    expect(screen.getByText('Quick ranges')).toBeTruthy()
  })

  it('enables clear all filters when only duration is selected', () => {
    renderWithProviders(
      <DashboardFilters
        filterTabIndex={0}
        onTabChange={jest.fn()}
        onClear={jest.fn()}
        isAdvancedEnabled={true}
        isDepartmentStateSelected={false}
        emptyOptions={emptyOptions}
        selectedState=""
        selectedDistrict=""
        selectedBlock=""
        selectedGramPanchayat=""
        selectedVillage=""
        selectedScheme=""
        selectedDuration={{ startDate: '11/03/2026', endDate: '12/03/2026' }}
        selectedDepartmentState=""
        selectedDepartmentZone=""
        selectedDepartmentCircle=""
        selectedDepartmentDivision=""
        selectedDepartmentSubdivision=""
        selectedDepartmentVillage=""
        districtOptions={emptyOptions}
        blockOptions={emptyOptions}
        gramPanchayatOptions={emptyOptions}
        villageOptions={emptyOptions}
        mockFilterStates={emptyOptions}
        mockFilterSchemes={emptyOptions}
        onStateChange={jest.fn()}
        onDistrictChange={jest.fn()}
        onBlockChange={jest.fn()}
        onGramPanchayatChange={jest.fn()}
        setSelectedVillage={jest.fn()}
        setSelectedScheme={jest.fn()}
        setSelectedDuration={jest.fn()}
        onDepartmentStateChange={jest.fn()}
        setSelectedDepartmentZone={jest.fn()}
        setSelectedDepartmentCircle={jest.fn()}
        setSelectedDepartmentDivision={jest.fn()}
        setSelectedDepartmentSubdivision={jest.fn()}
        setSelectedDepartmentVillage={jest.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'Clear all filters' }).getAttribute('disabled')).toBe(
      null
    )
  })

  it('clears search input text when clear all filters is clicked', () => {
    const onClear = jest.fn()

    renderWithProviders(
      <DashboardFilters
        filterTabIndex={0}
        onTabChange={jest.fn()}
        onClear={onClear}
        isAdvancedEnabled={true}
        isDepartmentStateSelected={false}
        emptyOptions={emptyOptions}
        selectedState=""
        selectedDistrict=""
        selectedBlock=""
        selectedGramPanchayat=""
        selectedVillage=""
        selectedScheme=""
        selectedDuration={{ startDate: '11/03/2026', endDate: '12/03/2026' }}
        selectedDepartmentState=""
        selectedDepartmentZone=""
        selectedDepartmentCircle=""
        selectedDepartmentDivision=""
        selectedDepartmentSubdivision=""
        selectedDepartmentVillage=""
        districtOptions={emptyOptions}
        blockOptions={emptyOptions}
        gramPanchayatOptions={emptyOptions}
        villageOptions={emptyOptions}
        mockFilterStates={emptyOptions}
        mockFilterSchemes={emptyOptions}
        onStateChange={jest.fn()}
        onDistrictChange={jest.fn()}
        onBlockChange={jest.fn()}
        onGramPanchayatChange={jest.fn()}
        setSelectedVillage={jest.fn()}
        setSelectedScheme={jest.fn()}
        setSelectedDuration={jest.fn()}
        onDepartmentStateChange={jest.fn()}
        setSelectedDepartmentZone={jest.fn()}
        setSelectedDepartmentCircle={jest.fn()}
        setSelectedDepartmentDivision={jest.fn()}
        setSelectedDepartmentSubdivision={jest.fn()}
        setSelectedDepartmentVillage={jest.fn()}
      />
    )

    const searchInput = screen.getByRole('textbox')
    fireEvent.change(searchInput, { target: { value: 'kgkjdhskh' } })
    expect((searchInput as HTMLInputElement).value).toBe('kgkjdhskh')

    fireEvent.click(screen.getByRole('button', { name: 'Clear all filters' }))

    expect(onClear).toHaveBeenCalledTimes(1)
    expect((searchInput as HTMLInputElement).value).toBe('')
  })

  it('clears search input text when selected location changes externally', () => {
    const Harness = () => {
      const [selectedState, setSelectedState] = useState('')

      return (
        <>
          <button type="button" onClick={() => setSelectedState('bihar')}>
            select bihar
          </button>
          <DashboardFilters
            filterTabIndex={0}
            onTabChange={jest.fn()}
            onClear={jest.fn()}
            isAdvancedEnabled={true}
            isDepartmentStateSelected={false}
            emptyOptions={emptyOptions}
            selectedState={selectedState}
            selectedDistrict=""
            selectedBlock=""
            selectedGramPanchayat=""
            selectedVillage=""
            selectedScheme=""
            selectedDuration={null}
            selectedDepartmentState=""
            selectedDepartmentZone=""
            selectedDepartmentCircle=""
            selectedDepartmentDivision=""
            selectedDepartmentSubdivision=""
            selectedDepartmentVillage=""
            districtOptions={emptyOptions}
            blockOptions={emptyOptions}
            gramPanchayatOptions={emptyOptions}
            villageOptions={emptyOptions}
            mockFilterStates={emptyOptions}
            mockFilterSchemes={emptyOptions}
            onStateChange={jest.fn()}
            onDistrictChange={jest.fn()}
            onBlockChange={jest.fn()}
            onGramPanchayatChange={jest.fn()}
            setSelectedVillage={jest.fn()}
            setSelectedScheme={jest.fn()}
            setSelectedDuration={jest.fn()}
            onDepartmentStateChange={jest.fn()}
            setSelectedDepartmentZone={jest.fn()}
            setSelectedDepartmentCircle={jest.fn()}
            setSelectedDepartmentDivision={jest.fn()}
            setSelectedDepartmentSubdivision={jest.fn()}
            setSelectedDepartmentVillage={jest.fn()}
          />
        </>
      )
    }

    renderWithProviders(<Harness />)

    const searchInput = screen.getByRole('textbox')
    fireEvent.change(searchInput, { target: { value: 'assam' } })
    expect((searchInput as HTMLInputElement).value).toBe('assam')

    fireEvent.click(screen.getByRole('button', { name: 'select bihar' }))

    expect((searchInput as HTMLInputElement).value).toBe('')
  })

  it('shows districts in breadcrumb search panel when state is already selected', () => {
    const districtOptions: SearchableSelectOption[] = [
      { value: 'sangareddy', label: 'Sangareddy' },
      { value: 'rangareddy', label: 'Ranga Reddy' },
    ]

    renderWithProviders(
      <DashboardFilters
        filterTabIndex={0}
        onTabChange={jest.fn()}
        onClear={jest.fn()}
        isAdvancedEnabled={true}
        isDepartmentStateSelected={false}
        emptyOptions={emptyOptions}
        selectedState="telangana"
        selectedDistrict=""
        selectedBlock=""
        selectedGramPanchayat=""
        selectedVillage=""
        selectedScheme=""
        selectedDuration={null}
        selectedDepartmentState=""
        selectedDepartmentZone=""
        selectedDepartmentCircle=""
        selectedDepartmentDivision=""
        selectedDepartmentSubdivision=""
        selectedDepartmentVillage=""
        districtOptions={districtOptions}
        blockOptions={emptyOptions}
        gramPanchayatOptions={emptyOptions}
        villageOptions={emptyOptions}
        mockFilterStates={[{ value: 'telangana', label: 'Telangana' }]}
        mockFilterSchemes={emptyOptions}
        onStateChange={jest.fn()}
        onDistrictChange={jest.fn()}
        onBlockChange={jest.fn()}
        onGramPanchayatChange={jest.fn()}
        setSelectedVillage={jest.fn()}
        setSelectedScheme={jest.fn()}
        setSelectedDuration={jest.fn()}
        onDepartmentStateChange={jest.fn()}
        setSelectedDepartmentZone={jest.fn()}
        setSelectedDepartmentCircle={jest.fn()}
        setSelectedDepartmentDivision={jest.fn()}
        setSelectedDepartmentSubdivision={jest.fn()}
        setSelectedDepartmentVillage={jest.fn()}
      />
    )

    const searchInput = screen.getByRole('textbox')
    fireEvent.focus(searchInput)

    expect(screen.getByText('Districts (2)')).toBeTruthy()
    expect(screen.getByText('Sangareddy')).toBeTruthy()
    expect(screen.getByText('Ranga Reddy')).toBeTruthy()
  })

  it('shows selected district in top breadcrumb path inside search panel', () => {
    const districtOptions: SearchableSelectOption[] = [
      { value: 'sangareddy', label: 'Sangareddy' },
      { value: 'rangareddy', label: 'Ranga Reddy' },
    ]

    renderWithProviders(
      <DashboardFilters
        filterTabIndex={0}
        onTabChange={jest.fn()}
        onClear={jest.fn()}
        isAdvancedEnabled={true}
        isDepartmentStateSelected={false}
        emptyOptions={emptyOptions}
        selectedState="telangana"
        selectedDistrict="sangareddy"
        selectedBlock=""
        selectedGramPanchayat=""
        selectedVillage=""
        selectedScheme=""
        selectedDuration={null}
        selectedDepartmentState=""
        selectedDepartmentZone=""
        selectedDepartmentCircle=""
        selectedDepartmentDivision=""
        selectedDepartmentSubdivision=""
        selectedDepartmentVillage=""
        districtOptions={districtOptions}
        blockOptions={emptyOptions}
        gramPanchayatOptions={emptyOptions}
        villageOptions={emptyOptions}
        mockFilterStates={[{ value: 'telangana', label: 'Telangana' }]}
        mockFilterSchemes={emptyOptions}
        onStateChange={jest.fn()}
        onDistrictChange={jest.fn()}
        onBlockChange={jest.fn()}
        onGramPanchayatChange={jest.fn()}
        setSelectedVillage={jest.fn()}
        setSelectedScheme={jest.fn()}
        setSelectedDuration={jest.fn()}
        onDepartmentStateChange={jest.fn()}
        setSelectedDepartmentZone={jest.fn()}
        setSelectedDepartmentCircle={jest.fn()}
        setSelectedDepartmentDivision={jest.fn()}
        setSelectedDepartmentSubdivision={jest.fn()}
        setSelectedDepartmentVillage={jest.fn()}
      />
    )

    const searchInput = screen.getByRole('textbox')
    fireEvent.focus(searchInput)

    expect(screen.getByText('All States/UTs')).toBeTruthy()
    expect(screen.getAllByText('Telangana').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Sangareddy').length).toBeGreaterThan(0)
  })

  it('loads department hierarchy labels when the departmental tab is active', () => {
    mockUseLocationHierarchyQuery.mockReturnValue({
      data: {
        data: {
          hierarchyType: 'department',
          levels: [
            { level: 1, levelName: [{ title: 'State' }] },
            { level: 2, levelName: [{ title: 'Zone' }] },
            { level: 3, levelName: [{ title: 'Circle' }] },
            { level: 4, levelName: [{ title: 'Division' }] },
            { level: 5, levelName: [{ title: 'Sub Division' }] },
          ],
        },
      },
    })
    mockUseLocationChildrenQuery.mockImplementation((args?: unknown) => {
      const options = args as { parentId?: number } | undefined
      if (options?.parentId === 101) {
        return {
          data: {
            data: [{ id: 201, title: 'North Zone' }],
          },
        }
      }

      if (options?.parentId === undefined) {
        return {
          data: {
            data: [{ id: 101, title: 'Telangana', lgdCode: 36 }],
          },
        }
      }

      return { data: undefined }
    })

    renderWithProviders(
      <DashboardFilters
        filterTabIndex={1}
        onTabChange={jest.fn()}
        onClear={jest.fn()}
        isAdvancedEnabled={true}
        isDepartmentStateSelected={false}
        emptyOptions={emptyOptions}
        selectedState="telangana"
        selectedDistrict=""
        selectedBlock=""
        selectedGramPanchayat=""
        selectedVillage=""
        selectedScheme=""
        selectedDuration={null}
        selectedDepartmentState=""
        selectedDepartmentZone=""
        selectedDepartmentCircle=""
        selectedDepartmentDivision=""
        selectedDepartmentSubdivision=""
        selectedDepartmentVillage=""
        districtOptions={emptyOptions}
        blockOptions={emptyOptions}
        gramPanchayatOptions={emptyOptions}
        villageOptions={emptyOptions}
        mockFilterStates={[{ value: 'telangana', label: 'Telangana' }]}
        mockFilterSchemes={emptyOptions}
        onStateChange={jest.fn()}
        onDistrictChange={jest.fn()}
        onBlockChange={jest.fn()}
        onGramPanchayatChange={jest.fn()}
        setSelectedVillage={jest.fn()}
        setSelectedScheme={jest.fn()}
        setSelectedDuration={jest.fn()}
        onDepartmentStateChange={jest.fn()}
        setSelectedDepartmentZone={jest.fn()}
        setSelectedDepartmentCircle={jest.fn()}
        setSelectedDepartmentDivision={jest.fn()}
        setSelectedDepartmentSubdivision={jest.fn()}
        setSelectedDepartmentVillage={jest.fn()}
      />
    )

    fireEvent.focus(screen.getByRole('textbox'))

    expect(mockUseLocationHierarchyQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        hierarchyType: 'DEPARTMENT',
      })
    )
    expect(screen.getByText(/Zones/)).toBeTruthy()
    expect(screen.getByText('North Zone')).toBeTruthy()
  })

  it('advances departmental breadcrumb flow from zone to circle and back', () => {
    mockUseLocationSearchQuery.mockReturnValue({
      data: {
        totalStatesCount: 1,
        states: [{ value: 'assam', label: 'Assam' }],
      },
    })
    mockUseLocationHierarchyQuery.mockReturnValue({
      data: {
        data: {
          hierarchyType: 'department',
          levels: [
            { level: 1, levelName: [{ title: 'State' }] },
            { level: 2, levelName: [{ title: 'Zone' }] },
            { level: 3, levelName: [{ title: 'Circle' }] },
            { level: 4, levelName: [{ title: 'Division' }] },
            { level: 5, levelName: [{ title: 'Sub Division' }] },
          ],
        },
      },
    })
    mockUseLocationChildrenQuery.mockImplementation((args?: unknown) => {
      const options = args as { parentId?: number } | undefined
      if (options?.parentId === 101) {
        return {
          data: {
            data: [{ id: 201, title: 'North Zone' }],
          },
        }
      }

      if (options?.parentId === 201) {
        return {
          data: {
            data: [{ id: 301, title: 'Guwahati Circle' }],
          },
        }
      }

      if (options?.parentId === undefined) {
        return {
          data: {
            data: [{ id: 101, title: 'Assam', lgdCode: 18 }],
          },
        }
      }

      return { data: undefined }
    })

    function Harness() {
      const [selectedDepartmentState, setSelectedDepartmentState] = useState('assam')
      const [selectedDepartmentZone, setSelectedDepartmentZone] = useState('')
      const [selectedDepartmentCircle, setSelectedDepartmentCircle] = useState('')
      const [selectedDepartmentDivision, setSelectedDepartmentDivision] = useState('')
      const [selectedDepartmentSubdivision, setSelectedDepartmentSubdivision] = useState('')

      const handleDepartmentStateChange = (value: string) => {
        setSelectedDepartmentState(value)
        setSelectedDepartmentZone('')
        setSelectedDepartmentCircle('')
        setSelectedDepartmentDivision('')
        setSelectedDepartmentSubdivision('')
      }

      const handleDepartmentZoneChange = (value: string) => {
        setSelectedDepartmentZone(value)
        setSelectedDepartmentCircle('')
        setSelectedDepartmentDivision('')
        setSelectedDepartmentSubdivision('')
      }

      const handleDepartmentCircleChange = (value: string) => {
        setSelectedDepartmentCircle(value)
        setSelectedDepartmentDivision('')
        setSelectedDepartmentSubdivision('')
      }

      return (
        <DashboardFilters
          filterTabIndex={1}
          onTabChange={jest.fn()}
          onClear={jest.fn()}
          isAdvancedEnabled={true}
          isDepartmentStateSelected={true}
          emptyOptions={emptyOptions}
          selectedState="assam"
          selectedDistrict=""
          selectedBlock=""
          selectedGramPanchayat=""
          selectedVillage=""
          selectedScheme=""
          selectedDuration={null}
          selectedDepartmentState={selectedDepartmentState}
          selectedDepartmentZone={selectedDepartmentZone}
          selectedDepartmentCircle={selectedDepartmentCircle}
          selectedDepartmentDivision={selectedDepartmentDivision}
          selectedDepartmentSubdivision={selectedDepartmentSubdivision}
          selectedDepartmentVillage=""
          activeTrailIndex={0}
          districtOptions={emptyOptions}
          blockOptions={emptyOptions}
          gramPanchayatOptions={emptyOptions}
          villageOptions={emptyOptions}
          mockFilterStates={[{ value: 'assam', label: 'Assam' }]}
          mockFilterSchemes={emptyOptions}
          onStateChange={jest.fn()}
          onDistrictChange={jest.fn()}
          onBlockChange={jest.fn()}
          onGramPanchayatChange={jest.fn()}
          setSelectedVillage={jest.fn()}
          setSelectedScheme={jest.fn()}
          setSelectedDuration={jest.fn()}
          onDepartmentStateChange={handleDepartmentStateChange}
          onDepartmentZoneChange={handleDepartmentZoneChange}
          onDepartmentCircleChange={handleDepartmentCircleChange}
          setSelectedDepartmentZone={jest.fn()}
          setSelectedDepartmentCircle={jest.fn()}
          setSelectedDepartmentDivision={jest.fn()}
          setSelectedDepartmentSubdivision={jest.fn()}
          setSelectedDepartmentVillage={jest.fn()}
        />
      )
    }

    renderWithProviders(<Harness />)

    fireEvent.focus(screen.getByRole('textbox'))
    expect(screen.getByText(/Zones/)).toBeTruthy()
    fireEvent.click(screen.getByText('North Zone'))

    fireEvent.focus(screen.getByRole('textbox'))
    expect(screen.getByText(/Circles/)).toBeTruthy()
    expect(screen.getByText('Guwahati Circle')).toBeTruthy()
    expect(screen.getAllByText('North Zone').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: 'Breadcrumb: Assam' }))

    expect(screen.getByText(/Zones/)).toBeTruthy()
    expect(screen.queryByText(/Circles/)).toBeNull()
  })

  it('shows departmental empty-state text using the active hierarchy label', () => {
    mockUseLocationSearchQuery.mockReturnValue({
      data: {
        totalStatesCount: 1,
        states: [{ value: 'assam', label: 'Assam' }],
      },
    })
    mockUseLocationHierarchyQuery.mockReturnValue({
      data: {
        data: {
          hierarchyType: 'department',
          levels: [
            { level: 1, levelName: [{ title: 'State' }] },
            { level: 2, levelName: [{ title: 'Zone' }] },
            { level: 3, levelName: [{ title: 'Circle' }] },
            { level: 4, levelName: [{ title: 'Division' }] },
            { level: 5, levelName: [{ title: 'Sub Division' }] },
          ],
        },
      },
    })
    mockUseLocationChildrenQuery.mockImplementation((args?: unknown) => {
      const options = args as { parentId?: number } | undefined
      if (options?.parentId === 101) {
        return {
          data: {
            data: [{ id: 201, title: 'North Zone' }],
          },
        }
      }

      if (options?.parentId === undefined) {
        return {
          data: {
            data: [{ id: 101, title: 'Assam', lgdCode: 18 }],
          },
        }
      }

      return { data: undefined }
    })

    renderWithProviders(
      <DashboardFilters
        filterTabIndex={1}
        onTabChange={jest.fn()}
        onClear={jest.fn()}
        isAdvancedEnabled={true}
        isDepartmentStateSelected={true}
        emptyOptions={emptyOptions}
        selectedState="assam"
        selectedDistrict=""
        selectedBlock=""
        selectedGramPanchayat=""
        selectedVillage=""
        selectedScheme=""
        selectedDuration={null}
        selectedDepartmentState="assam"
        selectedDepartmentZone=""
        selectedDepartmentCircle=""
        selectedDepartmentDivision=""
        selectedDepartmentSubdivision=""
        selectedDepartmentVillage=""
        districtOptions={emptyOptions}
        blockOptions={emptyOptions}
        gramPanchayatOptions={emptyOptions}
        villageOptions={emptyOptions}
        mockFilterStates={[{ value: 'assam', label: 'Assam' }]}
        mockFilterSchemes={emptyOptions}
        onStateChange={jest.fn()}
        onDistrictChange={jest.fn()}
        onBlockChange={jest.fn()}
        onGramPanchayatChange={jest.fn()}
        setSelectedVillage={jest.fn()}
        setSelectedScheme={jest.fn()}
        setSelectedDuration={jest.fn()}
        onDepartmentStateChange={jest.fn()}
        setSelectedDepartmentZone={jest.fn()}
        setSelectedDepartmentCircle={jest.fn()}
        setSelectedDepartmentDivision={jest.fn()}
        setSelectedDepartmentSubdivision={jest.fn()}
        setSelectedDepartmentVillage={jest.fn()}
      />
    )

    const searchInput = screen.getByRole('textbox')
    fireEvent.focus(searchInput)
    fireEvent.change(searchInput, { target: { value: 'kugkj' } })

    expect(screen.getByText('No zones found')).toBeTruthy()
    expect(screen.queryByText('No districts found')).toBeNull()
  })

  it('uses departmental subdivision selection for the leaf level', () => {
    mockUseLocationSearchQuery.mockReturnValue({
      data: {
        totalStatesCount: 1,
        states: [{ value: 'assam', label: 'Assam' }],
      },
    })
    mockUseLocationHierarchyQuery.mockReturnValue({
      data: {
        data: {
          hierarchyType: 'department',
          levels: [
            { level: 1, levelName: [{ title: 'State' }] },
            { level: 2, levelName: [{ title: 'Zone' }] },
            { level: 3, levelName: [{ title: 'Circle' }] },
            { level: 4, levelName: [{ title: 'Division' }] },
            { level: 5, levelName: [{ title: 'Sub Division' }] },
          ],
        },
      },
    })
    mockUseLocationChildrenQuery.mockImplementation((args?: unknown) => {
      const options = args as { parentId?: number } | undefined
      if (options?.parentId === 201) {
        return {
          data: {
            data: [{ id: 301, title: 'Guwahati Circle' }],
          },
        }
      }

      if (options?.parentId === 301) {
        return {
          data: {
            data: [{ id: 401, title: 'Nagaon Division' }],
          },
        }
      }

      if (options?.parentId === 401) {
        return {
          data: {
            data: [{ id: 501, title: 'Hojai Sub Division' }],
          },
        }
      }

      if (options?.parentId === undefined) {
        return {
          data: {
            data: [{ id: 201, title: 'North Zone' }],
          },
        }
      }

      return { data: undefined }
    })

    const handleDepartmentSubdivisionChange = jest.fn()

    renderWithProviders(
      <DashboardFilters
        filterTabIndex={1}
        onTabChange={jest.fn()}
        onClear={jest.fn()}
        isAdvancedEnabled={true}
        isDepartmentStateSelected={true}
        emptyOptions={emptyOptions}
        selectedState="assam"
        selectedDistrict=""
        selectedBlock=""
        selectedGramPanchayat=""
        selectedVillage=""
        selectedScheme=""
        selectedDuration={null}
        selectedDepartmentState="assam"
        selectedDepartmentZone="201:201:north-zone"
        selectedDepartmentCircle="301:301:guwahati-circle"
        selectedDepartmentDivision="401:401:nagaon-division"
        selectedDepartmentSubdivision=""
        selectedDepartmentVillage=""
        districtOptions={emptyOptions}
        blockOptions={emptyOptions}
        gramPanchayatOptions={emptyOptions}
        villageOptions={emptyOptions}
        mockFilterStates={[{ value: 'assam', label: 'Assam' }]}
        mockFilterSchemes={emptyOptions}
        onStateChange={jest.fn()}
        onDistrictChange={jest.fn()}
        onBlockChange={jest.fn()}
        onGramPanchayatChange={jest.fn()}
        setSelectedVillage={jest.fn()}
        setSelectedScheme={jest.fn()}
        setSelectedDuration={jest.fn()}
        onDepartmentStateChange={jest.fn()}
        onDepartmentZoneChange={jest.fn()}
        onDepartmentCircleChange={jest.fn()}
        onDepartmentDivisionChange={jest.fn()}
        onDepartmentSubdivisionChange={handleDepartmentSubdivisionChange}
        setSelectedDepartmentZone={jest.fn()}
        setSelectedDepartmentCircle={jest.fn()}
        setSelectedDepartmentDivision={jest.fn()}
        setSelectedDepartmentSubdivision={jest.fn()}
        setSelectedDepartmentVillage={jest.fn()}
      />
    )

    fireEvent.focus(screen.getByRole('textbox'))

    expect(screen.getByText(/Sub Divisions/)).toBeTruthy()
    fireEvent.click(screen.getByText('Hojai Sub Division'))

    expect(handleDepartmentSubdivisionChange).toHaveBeenCalledWith('501:501:hojai-sub-division')
  })

  it('shows blocks in breadcrumb search panel when district is selected', () => {
    const districtOptions: SearchableSelectOption[] = [
      { value: 'sangareddy', label: 'Sangareddy' },
      { value: 'rangareddy', label: 'Ranga Reddy' },
    ]
    const blockOptions: SearchableSelectOption[] = [
      { value: 'patancheru', label: 'Patancheru' },
      { value: 'zaheerabad', label: 'Zaheerabad' },
    ]

    renderWithProviders(
      <DashboardFilters
        filterTabIndex={0}
        onTabChange={jest.fn()}
        onClear={jest.fn()}
        isAdvancedEnabled={true}
        isDepartmentStateSelected={false}
        emptyOptions={emptyOptions}
        selectedState="telangana"
        selectedDistrict="sangareddy"
        selectedBlock=""
        selectedGramPanchayat=""
        selectedVillage=""
        selectedScheme=""
        selectedDuration={null}
        selectedDepartmentState=""
        selectedDepartmentZone=""
        selectedDepartmentCircle=""
        selectedDepartmentDivision=""
        selectedDepartmentSubdivision=""
        selectedDepartmentVillage=""
        districtOptions={districtOptions}
        blockOptions={blockOptions}
        gramPanchayatOptions={emptyOptions}
        villageOptions={emptyOptions}
        mockFilterStates={[{ value: 'telangana', label: 'Telangana' }]}
        mockFilterSchemes={emptyOptions}
        onStateChange={jest.fn()}
        onDistrictChange={jest.fn()}
        onBlockChange={jest.fn()}
        onGramPanchayatChange={jest.fn()}
        setSelectedVillage={jest.fn()}
        setSelectedScheme={jest.fn()}
        setSelectedDuration={jest.fn()}
        onDepartmentStateChange={jest.fn()}
        setSelectedDepartmentZone={jest.fn()}
        setSelectedDepartmentCircle={jest.fn()}
        setSelectedDepartmentDivision={jest.fn()}
        setSelectedDepartmentSubdivision={jest.fn()}
        setSelectedDepartmentVillage={jest.fn()}
      />
    )

    const searchInput = screen.getByRole('textbox')
    fireEvent.focus(searchInput)

    expect(screen.getByText('Blocks (2)')).toBeTruthy()
    expect(screen.getByText('Patancheru')).toBeTruthy()
    expect(screen.getByText('Zaheerabad')).toBeTruthy()
  })

  it('shows gram panchayats in breadcrumb search panel when block is selected', () => {
    const districtOptions: SearchableSelectOption[] = [
      { value: 'sangareddy', label: 'Sangareddy' },
      { value: 'rangareddy', label: 'Ranga Reddy' },
    ]
    const blockOptions: SearchableSelectOption[] = [
      { value: 'patancheru', label: 'Patancheru' },
      { value: 'zaheerabad', label: 'Zaheerabad' },
    ]
    const gramPanchayatOptions: SearchableSelectOption[] = [
      { value: 'isnapur', label: 'Isnapur' },
      { value: 'rudraram', label: 'Rudraram' },
    ]

    renderWithProviders(
      <DashboardFilters
        filterTabIndex={0}
        onTabChange={jest.fn()}
        onClear={jest.fn()}
        isAdvancedEnabled={true}
        isDepartmentStateSelected={false}
        emptyOptions={emptyOptions}
        selectedState="telangana"
        selectedDistrict="sangareddy"
        selectedBlock="patancheru"
        selectedGramPanchayat=""
        selectedVillage=""
        selectedScheme=""
        selectedDuration={null}
        selectedDepartmentState=""
        selectedDepartmentZone=""
        selectedDepartmentCircle=""
        selectedDepartmentDivision=""
        selectedDepartmentSubdivision=""
        selectedDepartmentVillage=""
        districtOptions={districtOptions}
        blockOptions={blockOptions}
        gramPanchayatOptions={gramPanchayatOptions}
        villageOptions={emptyOptions}
        mockFilterStates={[{ value: 'telangana', label: 'Telangana' }]}
        mockFilterSchemes={emptyOptions}
        onStateChange={jest.fn()}
        onDistrictChange={jest.fn()}
        onBlockChange={jest.fn()}
        onGramPanchayatChange={jest.fn()}
        setSelectedVillage={jest.fn()}
        setSelectedScheme={jest.fn()}
        setSelectedDuration={jest.fn()}
        onDepartmentStateChange={jest.fn()}
        setSelectedDepartmentZone={jest.fn()}
        setSelectedDepartmentCircle={jest.fn()}
        setSelectedDepartmentDivision={jest.fn()}
        setSelectedDepartmentSubdivision={jest.fn()}
        setSelectedDepartmentVillage={jest.fn()}
      />
    )

    const searchInput = screen.getByRole('textbox')
    fireEvent.focus(searchInput)

    expect(screen.getByText('Gram Panchayats (2)')).toBeTruthy()
    expect(screen.getByText('Isnapur')).toBeTruthy()
    expect(screen.getByText('Rudraram')).toBeTruthy()
  })

  it('filters malformed API labels from breadcrumb search options', () => {
    mockUseLocationSearchQuery.mockReturnValue({
      data: {
        totalStatesCount: 1,
        states: [{ value: 'assam', label: 'Assam', tenantId: 10 }],
      },
    })
    mockUseLocationChildrenQuery.mockImplementation((options: unknown) => {
      const { parentId } = (options as { parentId?: number }) ?? {}

      if (parentId === undefined) {
        return { data: { data: [{ id: 1, title: 'Assam' }] } }
      }
      if (parentId === 1) {
        return { data: { data: [{ id: 2, title: 'Barpeta' }] } }
      }
      if (parentId === 2) {
        return { data: { data: [{ id: 3, title: 'Chenga' }] } }
      }
      if (parentId === 3) {
        return {
          data: {
            data: [
              { id: 4, title: '<script>alert(1)</Script>s (1)' },
              { id: 5, title: 'Niz Bahari' },
            ],
          },
        }
      }

      return { data: undefined }
    })

    renderWithProviders(
      <DashboardFilters
        filterTabIndex={0}
        onTabChange={jest.fn()}
        onClear={jest.fn()}
        isAdvancedEnabled={true}
        isDepartmentStateSelected={false}
        emptyOptions={emptyOptions}
        selectedState="assam"
        selectedDistrict="2:barpeta"
        selectedBlock="3:chenga"
        selectedGramPanchayat=""
        selectedVillage=""
        selectedScheme=""
        selectedDuration={null}
        selectedDepartmentState=""
        selectedDepartmentZone=""
        selectedDepartmentCircle=""
        selectedDepartmentDivision=""
        selectedDepartmentSubdivision=""
        selectedDepartmentVillage=""
        districtOptions={emptyOptions}
        blockOptions={emptyOptions}
        gramPanchayatOptions={emptyOptions}
        villageOptions={emptyOptions}
        mockFilterStates={emptyOptions}
        mockFilterSchemes={emptyOptions}
        onStateChange={jest.fn()}
        onDistrictChange={jest.fn()}
        onBlockChange={jest.fn()}
        onGramPanchayatChange={jest.fn()}
        setSelectedVillage={jest.fn()}
        setSelectedScheme={jest.fn()}
        setSelectedDuration={jest.fn()}
        onDepartmentStateChange={jest.fn()}
        setSelectedDepartmentZone={jest.fn()}
        setSelectedDepartmentCircle={jest.fn()}
        setSelectedDepartmentDivision={jest.fn()}
        setSelectedDepartmentSubdivision={jest.fn()}
        setSelectedDepartmentVillage={jest.fn()}
      />
    )

    const searchInput = screen.getByRole('textbox')
    fireEvent.focus(searchInput)

    expect(screen.getByText('Gram Panchayats (1)')).toBeTruthy()
    expect(screen.getByText('Niz Bahari')).toBeTruthy()
    expect(screen.queryByText('<script>alert(1)</Script>s (1)')).toBeNull()
  })

  it('resolves the tenant from the slug when department state is hydrated as a stable value', () => {
    mockUseLocationSearchQuery.mockReturnValue({
      data: {
        totalStatesCount: 1,
        states: [{ value: 'assam', label: 'Assam', tenantId: 17, tenantCode: 'AS' }],
      },
    })

    renderWithProviders(
      <DashboardFilters
        filterTabIndex={1}
        onTabChange={jest.fn()}
        onClear={jest.fn()}
        isAdvancedEnabled={true}
        isDepartmentStateSelected={true}
        emptyOptions={emptyOptions}
        selectedState="assam"
        selectedDistrict=""
        selectedBlock=""
        selectedGramPanchayat=""
        selectedVillage=""
        selectedScheme=""
        selectedDuration={null}
        selectedDepartmentState="101:18:assam"
        selectedDepartmentZone=""
        selectedDepartmentCircle=""
        selectedDepartmentDivision=""
        selectedDepartmentSubdivision=""
        selectedDepartmentVillage=""
        districtOptions={emptyOptions}
        blockOptions={emptyOptions}
        gramPanchayatOptions={emptyOptions}
        villageOptions={emptyOptions}
        mockFilterStates={emptyOptions}
        mockFilterSchemes={emptyOptions}
        onStateChange={jest.fn()}
        onDistrictChange={jest.fn()}
        onBlockChange={jest.fn()}
        onGramPanchayatChange={jest.fn()}
        setSelectedVillage={jest.fn()}
        setSelectedScheme={jest.fn()}
        setSelectedDuration={jest.fn()}
        onDepartmentStateChange={jest.fn()}
        setSelectedDepartmentZone={jest.fn()}
        setSelectedDepartmentCircle={jest.fn()}
        setSelectedDepartmentDivision={jest.fn()}
        setSelectedDepartmentSubdivision={jest.fn()}
        setSelectedDepartmentVillage={jest.fn()}
      />
    )

    expect(mockUseLocationChildrenQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 17,
        tenantCode: 'AS',
        hierarchyType: 'DEPARTMENT',
        enabled: true,
      })
    )
  })

  it('clears lower department selections when fallback setter handlers are used', () => {
    mockUseLocationSearchQuery.mockReturnValue({
      data: {
        totalStatesCount: 1,
        states: [{ value: 'assam', label: 'Assam', tenantId: 17, tenantCode: 'AS' }],
      },
    })
    mockUseLocationChildrenQuery.mockImplementation((args?: unknown) => {
      const options = args as { parentId?: number } | undefined
      if (options?.parentId === 101) {
        return {
          data: {
            data: [{ id: 201, title: 'North Zone' }],
          },
        }
      }

      if (options?.parentId === undefined) {
        return {
          data: {
            data: [{ id: 101, title: 'Assam', lgdCode: 18 }],
          },
        }
      }

      return { data: undefined }
    })

    const setSelectedDepartmentZone = jest.fn()
    const setSelectedDepartmentCircle = jest.fn()
    const setSelectedDepartmentDivision = jest.fn()
    const setSelectedDepartmentSubdivision = jest.fn()
    const setSelectedDepartmentVillage = jest.fn()

    renderWithProviders(
      <DashboardFilters
        filterTabIndex={1}
        onTabChange={jest.fn()}
        onClear={jest.fn()}
        isAdvancedEnabled={true}
        isDepartmentStateSelected={true}
        emptyOptions={emptyOptions}
        selectedState="assam"
        selectedDistrict=""
        selectedBlock=""
        selectedGramPanchayat=""
        selectedVillage=""
        selectedScheme=""
        selectedDuration={null}
        selectedDepartmentState="101:18:assam"
        selectedDepartmentZone=""
        selectedDepartmentCircle=""
        selectedDepartmentDivision=""
        selectedDepartmentSubdivision=""
        selectedDepartmentVillage=""
        districtOptions={emptyOptions}
        blockOptions={emptyOptions}
        gramPanchayatOptions={emptyOptions}
        villageOptions={emptyOptions}
        mockFilterStates={emptyOptions}
        mockFilterSchemes={emptyOptions}
        onStateChange={jest.fn()}
        onDistrictChange={jest.fn()}
        onBlockChange={jest.fn()}
        onGramPanchayatChange={jest.fn()}
        setSelectedVillage={jest.fn()}
        setSelectedScheme={jest.fn()}
        setSelectedDuration={jest.fn()}
        onDepartmentStateChange={jest.fn()}
        setSelectedDepartmentZone={setSelectedDepartmentZone}
        setSelectedDepartmentCircle={setSelectedDepartmentCircle}
        setSelectedDepartmentDivision={setSelectedDepartmentDivision}
        setSelectedDepartmentSubdivision={setSelectedDepartmentSubdivision}
        setSelectedDepartmentVillage={setSelectedDepartmentVillage}
      />
    )

    fireEvent.focus(screen.getByRole('textbox'))
    fireEvent.click(screen.getByText('North Zone'))

    expect(setSelectedDepartmentZone).toHaveBeenCalledWith('201:201:north-zone')
    expect(setSelectedDepartmentCircle).toHaveBeenCalledWith('')
    expect(setSelectedDepartmentDivision).toHaveBeenCalledWith('')
    expect(setSelectedDepartmentSubdivision).toHaveBeenCalledWith('')
    expect(setSelectedDepartmentVillage).toHaveBeenCalledWith('')
  })

  it('ignores manual active trail control in department mode and uses the deepest selection', () => {
    mockUseLocationSearchQuery.mockReturnValue({
      data: {
        totalStatesCount: 1,
        states: [{ value: 'assam', label: 'Assam', tenantId: 17, tenantCode: 'AS' }],
      },
    })
    mockUseLocationHierarchyQuery.mockReturnValue({
      data: {
        data: {
          levels: [
            { level: 1, levelName: [{ title: 'State' }] },
            { level: 2, levelName: [{ title: 'Zone' }] },
            { level: 3, levelName: [{ title: 'Circle' }] },
            { level: 4, levelName: [{ title: 'Division' }] },
            { level: 5, levelName: [{ title: 'Village' }] },
          ],
        },
      },
    })
    mockUseLocationChildrenQuery.mockImplementation((args?: unknown) => {
      const options = args as { parentId?: number } | undefined
      if (options?.parentId === undefined) {
        return {
          data: {
            data: [{ id: 101, title: 'Assam', lgdCode: 18 }],
          },
        }
      }
      if (options?.parentId === 101) {
        return {
          data: {
            data: [{ id: 201, title: 'North Zone' }],
          },
        }
      }
      if (options?.parentId === 201) {
        return {
          data: {
            data: [{ id: 301, title: 'Guwahati Circle' }],
          },
        }
      }
      if (options?.parentId === 301) {
        return {
          data: {
            data: [{ id: 401, title: 'Division 1' }],
          },
        }
      }
      if (options?.parentId === 401) {
        return {
          data: {
            data: [{ id: 501, title: 'Village 1' }],
          },
        }
      }

      return { data: undefined }
    })

    renderWithProviders(
      <DashboardFilters
        filterTabIndex={1}
        onTabChange={jest.fn()}
        onClear={jest.fn()}
        isAdvancedEnabled={true}
        isDepartmentStateSelected={true}
        emptyOptions={emptyOptions}
        selectedState="assam"
        selectedDistrict=""
        selectedBlock=""
        selectedGramPanchayat=""
        selectedVillage=""
        selectedScheme=""
        selectedDuration={null}
        selectedDepartmentState="101:18:assam"
        selectedDepartmentZone="201:201:north-zone"
        selectedDepartmentCircle="301:301:guwahati-circle"
        selectedDepartmentDivision="401:401:division-1"
        selectedDepartmentSubdivision=""
        selectedDepartmentVillage="501:501:village-1"
        activeTrailIndex={1}
        districtOptions={emptyOptions}
        blockOptions={emptyOptions}
        gramPanchayatOptions={emptyOptions}
        villageOptions={emptyOptions}
        mockFilterStates={emptyOptions}
        mockFilterSchemes={emptyOptions}
        onStateChange={jest.fn()}
        onDistrictChange={jest.fn()}
        onBlockChange={jest.fn()}
        onGramPanchayatChange={jest.fn()}
        setSelectedVillage={jest.fn()}
        setSelectedScheme={jest.fn()}
        setSelectedDuration={jest.fn()}
        onDepartmentStateChange={jest.fn()}
        onDepartmentZoneChange={jest.fn()}
        onDepartmentCircleChange={jest.fn()}
        onDepartmentDivisionChange={jest.fn()}
        onDepartmentVillageChange={jest.fn()}
        setSelectedDepartmentZone={jest.fn()}
        setSelectedDepartmentCircle={jest.fn()}
        setSelectedDepartmentDivision={jest.fn()}
        setSelectedDepartmentSubdivision={jest.fn()}
        setSelectedDepartmentVillage={jest.fn()}
      />
    )

    fireEvent.focus(screen.getByRole('textbox'))

    expect(screen.getByText('Villages (1)')).toBeTruthy()
    expect(screen.getAllByText('Village 1').length).toBeGreaterThan(0)
    expect(screen.queryByText('Circles (1)')).toBeNull()
  })

  it('shows villages in breadcrumb search panel when gram panchayat is selected', () => {
    const districtOptions: SearchableSelectOption[] = [
      { value: 'sangareddy', label: 'Sangareddy' },
      { value: 'rangareddy', label: 'Ranga Reddy' },
    ]
    const blockOptions: SearchableSelectOption[] = [
      { value: 'patancheru', label: 'Patancheru' },
      { value: 'zaheerabad', label: 'Zaheerabad' },
    ]
    const gramPanchayatOptions: SearchableSelectOption[] = [
      { value: 'isnapur', label: 'Isnapur' },
      { value: 'rudraram', label: 'Rudraram' },
    ]
    const villageOptions: SearchableSelectOption[] = [
      { value: 'kistareddypet', label: 'Kistareddypet' },
      { value: 'industrial-area', label: 'Industrial Area' },
    ]

    renderWithProviders(
      <DashboardFilters
        filterTabIndex={0}
        onTabChange={jest.fn()}
        onClear={jest.fn()}
        isAdvancedEnabled={true}
        isDepartmentStateSelected={false}
        emptyOptions={emptyOptions}
        selectedState="telangana"
        selectedDistrict="sangareddy"
        selectedBlock="patancheru"
        selectedGramPanchayat="isnapur"
        selectedVillage=""
        selectedScheme=""
        selectedDuration={null}
        selectedDepartmentState=""
        selectedDepartmentZone=""
        selectedDepartmentCircle=""
        selectedDepartmentDivision=""
        selectedDepartmentSubdivision=""
        selectedDepartmentVillage=""
        districtOptions={districtOptions}
        blockOptions={blockOptions}
        gramPanchayatOptions={gramPanchayatOptions}
        villageOptions={villageOptions}
        mockFilterStates={[{ value: 'telangana', label: 'Telangana' }]}
        mockFilterSchemes={emptyOptions}
        onStateChange={jest.fn()}
        onDistrictChange={jest.fn()}
        onBlockChange={jest.fn()}
        onGramPanchayatChange={jest.fn()}
        setSelectedVillage={jest.fn()}
        setSelectedScheme={jest.fn()}
        setSelectedDuration={jest.fn()}
        onDepartmentStateChange={jest.fn()}
        setSelectedDepartmentZone={jest.fn()}
        setSelectedDepartmentCircle={jest.fn()}
        setSelectedDepartmentDivision={jest.fn()}
        setSelectedDepartmentSubdivision={jest.fn()}
        setSelectedDepartmentVillage={jest.fn()}
      />
    )

    const searchInput = screen.getByRole('textbox')
    fireEvent.focus(searchInput)

    expect(screen.getByText('Villages (2)')).toBeTruthy()
    expect(screen.getByText('Kistareddypet')).toBeTruthy()
    expect(screen.getByText('Industrial Area')).toBeTruthy()
  })

  it('closes breadcrumb dropdown when a village is selected', () => {
    const districtOptions: SearchableSelectOption[] = [
      { value: 'sangareddy', label: 'Sangareddy' },
      { value: 'rangareddy', label: 'Ranga Reddy' },
    ]
    const blockOptions: SearchableSelectOption[] = [
      { value: 'patancheru', label: 'Patancheru' },
      { value: 'zaheerabad', label: 'Zaheerabad' },
    ]
    const gramPanchayatOptions: SearchableSelectOption[] = [
      { value: 'isnapur', label: 'Isnapur' },
      { value: 'rudraram', label: 'Rudraram' },
    ]
    const villageOptions: SearchableSelectOption[] = [
      { value: 'kistareddypet', label: 'Kistareddypet' },
      { value: 'industrial-area', label: 'Industrial Area' },
    ]

    function Harness() {
      const [selectedVillage, setSelectedVillage] = useState('')

      return (
        <DashboardFilters
          filterTabIndex={0}
          onTabChange={jest.fn()}
          onClear={jest.fn()}
          isAdvancedEnabled={true}
          isDepartmentStateSelected={false}
          emptyOptions={emptyOptions}
          selectedState="telangana"
          selectedDistrict="sangareddy"
          selectedBlock="patancheru"
          selectedGramPanchayat="isnapur"
          selectedVillage={selectedVillage}
          selectedScheme=""
          selectedDuration={null}
          selectedDepartmentState=""
          selectedDepartmentZone=""
          selectedDepartmentCircle=""
          selectedDepartmentDivision=""
          selectedDepartmentSubdivision=""
          selectedDepartmentVillage=""
          districtOptions={districtOptions}
          blockOptions={blockOptions}
          gramPanchayatOptions={gramPanchayatOptions}
          villageOptions={villageOptions}
          mockFilterStates={[{ value: 'telangana', label: 'Telangana' }]}
          mockFilterSchemes={emptyOptions}
          onStateChange={jest.fn()}
          onDistrictChange={jest.fn()}
          onBlockChange={jest.fn()}
          onGramPanchayatChange={jest.fn()}
          setSelectedVillage={setSelectedVillage}
          setSelectedScheme={jest.fn()}
          setSelectedDuration={jest.fn()}
          onDepartmentStateChange={jest.fn()}
          setSelectedDepartmentZone={jest.fn()}
          setSelectedDepartmentCircle={jest.fn()}
          setSelectedDepartmentDivision={jest.fn()}
          setSelectedDepartmentSubdivision={jest.fn()}
          setSelectedDepartmentVillage={jest.fn()}
        />
      )
    }

    renderWithProviders(<Harness />)

    const searchInput = screen.getByRole('textbox')
    fireEvent.focus(searchInput)
    expect(screen.getByText('Villages (2)')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Kistareddypet' }))

    expect(screen.queryByText('Villages (2)')).toBeNull()
  })

  it('shows child-level options when a breadcrumb item is clicked', () => {
    const districtOptions: SearchableSelectOption[] = [
      { value: 'sangareddy', label: 'Sangareddy' },
      { value: 'rangareddy', label: 'Ranga Reddy' },
    ]
    const blockOptions: SearchableSelectOption[] = [
      { value: 'patancheru', label: 'Patancheru' },
      { value: 'zaheerabad', label: 'Zaheerabad' },
    ]
    const gramPanchayatOptions: SearchableSelectOption[] = [
      { value: 'isnapur', label: 'Isnapur' },
      { value: 'rudraram', label: 'Rudraram' },
    ]
    const villageOptions: SearchableSelectOption[] = [
      { value: 'kistareddypet', label: 'Kistareddypet' },
      { value: 'industrial-area', label: 'Industrial Area' },
    ]

    function Harness() {
      const [selectedState, setSelectedState] = useState('telangana')
      const [selectedDistrict, setSelectedDistrict] = useState('sangareddy')
      const [selectedBlock, setSelectedBlock] = useState('patancheru')
      const [selectedGramPanchayat, setSelectedGramPanchayat] = useState('isnapur')
      const [selectedVillage, setSelectedVillage] = useState('kistareddypet')
      const [activeTrailIndex, setActiveTrailIndex] = useState<number | null>(null)

      const handleStateChange = (value: string) => {
        setSelectedState(value)
        setSelectedDistrict('')
        setSelectedBlock('')
        setSelectedGramPanchayat('')
        setSelectedVillage('')
      }

      const handleDistrictChange = (value: string) => {
        setSelectedDistrict(value)
        setSelectedBlock('')
        setSelectedGramPanchayat('')
        setSelectedVillage('')
      }

      const handleBlockChange = (value: string) => {
        setSelectedBlock(value)
        setSelectedGramPanchayat('')
        setSelectedVillage('')
      }

      const handleGramPanchayatChange = (value: string) => {
        setSelectedGramPanchayat(value)
        setSelectedVillage('')
      }

      return (
        <DashboardFilters
          filterTabIndex={0}
          onTabChange={jest.fn()}
          onClear={jest.fn()}
          isAdvancedEnabled={true}
          isDepartmentStateSelected={false}
          emptyOptions={emptyOptions}
          selectedState={selectedState}
          selectedDistrict={selectedDistrict}
          selectedBlock={selectedBlock}
          selectedGramPanchayat={selectedGramPanchayat}
          selectedVillage={selectedVillage}
          selectedScheme=""
          selectedDuration={null}
          selectedDepartmentState=""
          selectedDepartmentZone=""
          selectedDepartmentCircle=""
          selectedDepartmentDivision=""
          selectedDepartmentSubdivision=""
          selectedDepartmentVillage=""
          activeTrailIndex={activeTrailIndex}
          districtOptions={selectedState ? districtOptions : emptyOptions}
          blockOptions={selectedDistrict ? blockOptions : emptyOptions}
          gramPanchayatOptions={selectedBlock ? gramPanchayatOptions : emptyOptions}
          villageOptions={selectedGramPanchayat ? villageOptions : emptyOptions}
          mockFilterStates={[{ value: 'telangana', label: 'Telangana' }]}
          mockFilterSchemes={emptyOptions}
          onStateChange={handleStateChange}
          onDistrictChange={handleDistrictChange}
          onBlockChange={handleBlockChange}
          onGramPanchayatChange={handleGramPanchayatChange}
          setSelectedVillage={setSelectedVillage}
          setSelectedScheme={jest.fn()}
          setSelectedDuration={jest.fn()}
          onDepartmentStateChange={jest.fn()}
          setSelectedDepartmentZone={jest.fn()}
          setSelectedDepartmentCircle={jest.fn()}
          setSelectedDepartmentDivision={jest.fn()}
          setSelectedDepartmentSubdivision={jest.fn()}
          setSelectedDepartmentVillage={jest.fn()}
          onActiveTrailChange={setActiveTrailIndex}
        />
      )
    }

    renderWithProviders(<Harness />)

    const searchInput = screen.getByRole('textbox') as HTMLInputElement

    fireEvent.focus(searchInput)
    expect(screen.getByText('Villages (2)')).toBeTruthy()

    fireEvent.change(searchInput, { target: { value: 'kist' } })
    expect(searchInput.value).toBe('kist')

    fireEvent.click(screen.getByRole('button', { name: 'Breadcrumb: Patancheru' }))

    expect(searchInput.value).toBe('')
    expect(screen.getByText('Gram Panchayats (2)')).toBeTruthy()
    expect(screen.getAllByText('Isnapur').length).toBeGreaterThan(0)
    expect(screen.getByText('Rudraram')).toBeTruthy()
    expect(screen.queryByText('Villages (2)')).toBeNull()
  })

  it('allows clicking closed breadcrumb chips to navigate to that dashboard level', () => {
    const districtOptions: SearchableSelectOption[] = [
      { value: 'sangareddy', label: 'Sangareddy' },
      { value: 'rangareddy', label: 'Ranga Reddy' },
    ]
    const blockOptions: SearchableSelectOption[] = [
      { value: 'patancheru', label: 'Patancheru' },
      { value: 'zaheerabad', label: 'Zaheerabad' },
    ]
    const gramPanchayatOptions: SearchableSelectOption[] = [
      { value: 'isnapur', label: 'Isnapur' },
      { value: 'rudraram', label: 'Rudraram' },
    ]
    const villageOptions: SearchableSelectOption[] = [
      { value: 'kistareddypet', label: 'Kistareddypet' },
      { value: 'industrial-area', label: 'Industrial Area' },
    ]

    function Harness() {
      const [selectedState, setSelectedState] = useState('telangana')
      const [selectedDistrict, setSelectedDistrict] = useState('sangareddy')
      const [selectedBlock, setSelectedBlock] = useState('patancheru')
      const [selectedGramPanchayat, setSelectedGramPanchayat] = useState('isnapur')
      const [selectedVillage, setSelectedVillage] = useState('kistareddypet')
      const [activeTrailIndex, setActiveTrailIndex] = useState<number | null>(null)

      const handleStateChange = (value: string) => {
        setSelectedState(value)
        setSelectedDistrict('')
        setSelectedBlock('')
        setSelectedGramPanchayat('')
        setSelectedVillage('')
      }

      const handleDistrictChange = (value: string) => {
        setSelectedDistrict(value)
        setSelectedBlock('')
        setSelectedGramPanchayat('')
        setSelectedVillage('')
      }

      const handleBlockChange = (value: string) => {
        setSelectedBlock(value)
        setSelectedGramPanchayat('')
        setSelectedVillage('')
      }

      const handleGramPanchayatChange = (value: string) => {
        setSelectedGramPanchayat(value)
        setSelectedVillage('')
      }

      return (
        <DashboardFilters
          filterTabIndex={0}
          onTabChange={jest.fn()}
          onClear={jest.fn()}
          isAdvancedEnabled={true}
          isDepartmentStateSelected={false}
          emptyOptions={emptyOptions}
          selectedState={selectedState}
          selectedDistrict={selectedDistrict}
          selectedBlock={selectedBlock}
          selectedGramPanchayat={selectedGramPanchayat}
          selectedVillage={selectedVillage}
          selectedScheme=""
          selectedDuration={null}
          selectedDepartmentState=""
          selectedDepartmentZone=""
          selectedDepartmentCircle=""
          selectedDepartmentDivision=""
          selectedDepartmentSubdivision=""
          selectedDepartmentVillage=""
          activeTrailIndex={activeTrailIndex}
          districtOptions={selectedState ? districtOptions : emptyOptions}
          blockOptions={selectedDistrict ? blockOptions : emptyOptions}
          gramPanchayatOptions={selectedBlock ? gramPanchayatOptions : emptyOptions}
          villageOptions={selectedGramPanchayat ? villageOptions : emptyOptions}
          mockFilterStates={[{ value: 'telangana', label: 'Telangana' }]}
          mockFilterSchemes={emptyOptions}
          onStateChange={handleStateChange}
          onDistrictChange={handleDistrictChange}
          onBlockChange={handleBlockChange}
          onGramPanchayatChange={handleGramPanchayatChange}
          setSelectedVillage={setSelectedVillage}
          setSelectedScheme={jest.fn()}
          setSelectedDuration={jest.fn()}
          onDepartmentStateChange={jest.fn()}
          setSelectedDepartmentZone={jest.fn()}
          setSelectedDepartmentCircle={jest.fn()}
          setSelectedDepartmentDivision={jest.fn()}
          setSelectedDepartmentSubdivision={jest.fn()}
          setSelectedDepartmentVillage={jest.fn()}
          onActiveTrailChange={setActiveTrailIndex}
        />
      )
    }

    renderWithProviders(<Harness />)

    expect(screen.getByRole('button', { name: 'Breadcrumb: Patancheru' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Breadcrumb: Sangareddy' }))

    expect(screen.queryByRole('button', { name: 'Breadcrumb: Patancheru' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Breadcrumb: Isnapur' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Breadcrumb: Kistareddypet' })).toBeNull()

    const searchInput = screen.getByRole('textbox')
    fireEvent.focus(searchInput)

    expect(screen.getByText('Blocks (2)')).toBeTruthy()
    expect(screen.queryByText('Gram Panchayats (2)')).toBeNull()
  })

  it('shows tabs from start and enables them after state selection', () => {
    const districtOptions: SearchableSelectOption[] = [
      { value: 'sangareddy', label: 'Sangareddy' },
      { value: 'rangareddy', label: 'Ranga Reddy' },
    ]

    const { rerender } = renderWithProviders(
      <DashboardFilters
        filterTabIndex={0}
        onTabChange={jest.fn()}
        onClear={jest.fn()}
        isAdvancedEnabled={true}
        isDepartmentStateSelected={false}
        emptyOptions={emptyOptions}
        selectedState=""
        selectedDistrict=""
        selectedBlock=""
        selectedGramPanchayat=""
        selectedVillage=""
        selectedScheme=""
        selectedDuration={null}
        selectedDepartmentState=""
        selectedDepartmentZone=""
        selectedDepartmentCircle=""
        selectedDepartmentDivision=""
        selectedDepartmentSubdivision=""
        selectedDepartmentVillage=""
        districtOptions={emptyOptions}
        blockOptions={emptyOptions}
        gramPanchayatOptions={emptyOptions}
        villageOptions={emptyOptions}
        mockFilterStates={[{ value: 'telangana', label: 'Telangana' }]}
        mockFilterSchemes={emptyOptions}
        onStateChange={jest.fn()}
        onDistrictChange={jest.fn()}
        onBlockChange={jest.fn()}
        onGramPanchayatChange={jest.fn()}
        setSelectedVillage={jest.fn()}
        setSelectedScheme={jest.fn()}
        setSelectedDuration={jest.fn()}
        onDepartmentStateChange={jest.fn()}
        setSelectedDepartmentZone={jest.fn()}
        setSelectedDepartmentCircle={jest.fn()}
        setSelectedDepartmentDivision={jest.fn()}
        setSelectedDepartmentSubdivision={jest.fn()}
        setSelectedDepartmentVillage={jest.fn()}
      />
    )

    const searchInput = screen.getByRole('textbox')
    fireEvent.focus(searchInput)
    expect(screen.getByTestId('search-dropdown-tabs')).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Administrative' }).getAttribute('disabled')).not.toBe(
      null
    )
    expect(screen.getByRole('tab', { name: 'Departmental' }).getAttribute('disabled')).not.toBe(
      null
    )

    rerender(
      <DashboardFilters
        filterTabIndex={0}
        onTabChange={jest.fn()}
        onClear={jest.fn()}
        isAdvancedEnabled={true}
        isDepartmentStateSelected={false}
        emptyOptions={emptyOptions}
        selectedState="telangana"
        selectedDistrict=""
        selectedBlock=""
        selectedGramPanchayat=""
        selectedVillage=""
        selectedScheme=""
        selectedDuration={null}
        selectedDepartmentState=""
        selectedDepartmentZone=""
        selectedDepartmentCircle=""
        selectedDepartmentDivision=""
        selectedDepartmentSubdivision=""
        selectedDepartmentVillage=""
        districtOptions={districtOptions}
        blockOptions={emptyOptions}
        gramPanchayatOptions={emptyOptions}
        villageOptions={emptyOptions}
        mockFilterStates={[{ value: 'telangana', label: 'Telangana' }]}
        mockFilterSchemes={emptyOptions}
        onStateChange={jest.fn()}
        onDistrictChange={jest.fn()}
        onBlockChange={jest.fn()}
        onGramPanchayatChange={jest.fn()}
        setSelectedVillage={jest.fn()}
        setSelectedScheme={jest.fn()}
        setSelectedDuration={jest.fn()}
        onDepartmentStateChange={jest.fn()}
        setSelectedDepartmentZone={jest.fn()}
        setSelectedDepartmentCircle={jest.fn()}
        setSelectedDepartmentDivision={jest.fn()}
        setSelectedDepartmentSubdivision={jest.fn()}
        setSelectedDepartmentVillage={jest.fn()}
      />
    )

    fireEvent.focus(searchInput)
    expect(screen.getByTestId('search-dropdown-tabs')).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Administrative' }).getAttribute('disabled')).toBe(null)
    expect(screen.getByRole('tab', { name: 'Departmental' }).getAttribute('disabled')).toBe(null)
  })
})
