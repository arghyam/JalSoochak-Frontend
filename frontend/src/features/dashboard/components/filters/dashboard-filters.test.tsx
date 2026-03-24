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

    const searchInput = screen.getByPlaceholderText(
      'Search by state/UT, district, block, gram panchayat, village'
    )
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

    const searchInput = screen.getByPlaceholderText(
      'Search by state/UT, district, block, gram panchayat, village'
    )
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

      if (parentId === 0) {
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

    const searchInput = screen.getByPlaceholderText(
      'Search by state/UT, district, block, gram panchayat, village'
    )
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

    const searchInput = screen.getByPlaceholderText(
      'Search by state/UT, district, block, gram panchayat, village'
    )
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
          filterTabIndex={1}
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

    const searchInput = screen.getByPlaceholderText(
      'Search by state/UT, district, block, gram panchayat, village'
    ) as HTMLInputElement

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
          filterTabIndex={1}
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

    const searchInput = screen.getByPlaceholderText(
      'Search by state/UT, district, block, gram panchayat, village'
    )
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

    const searchInput = screen.getByPlaceholderText(
      'Search by state/UT, district, block, gram panchayat, village'
    )
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
