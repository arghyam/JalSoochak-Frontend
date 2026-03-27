export interface IntegrationConfiguration extends Record<string, unknown> {
  id: string
  apiUrl: string
  apiKey: string
  organizationId: string
  isConfigured: boolean
}
