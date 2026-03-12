export const locationSearchQueryKeys = {
  all: ['dashboard', 'location-search'] as const,
  statesUts: (trigger = 0) => ['dashboard', 'location-search', 'states-uts', trigger] as const,
}
