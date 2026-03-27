import type { StateUtSearchResponse } from '../../types'

const mockStateUtData: StateUtSearchResponse = {
  totalStatesCount: 36,
  states: [{ value: 'telangana', label: 'Telangana' }],
}

export const locationSearchMockService = {
  getStatesUts: async (): Promise<StateUtSearchResponse> => {
    return Promise.resolve(mockStateUtData)
  },
}
