import { getRuntimeConfig } from '@/config/runtime-config'
import { ASSAM_BRANDING } from './assam-branding'
import type { BrandingProfile } from './branding-profile'
import { PUNJAB_BRANDING } from './punjab-branding'

export const BRANDING_PROFILES = {
  assam: ASSAM_BRANDING,
  punjab: PUNJAB_BRANDING,
} as const satisfies Record<string, BrandingProfile>

export type BrandingProfileId = keyof typeof BRANDING_PROFILES

/** Used when `APP_CONFIG.BRANDING_PROFILE` is absent, which keeps the Assam deployment as-is. */
export const DEFAULT_BRANDING_PROFILE_ID: BrandingProfileId = 'assam'

export function isBrandingProfileId(value: unknown): value is BrandingProfileId {
  return typeof value === 'string' && Object.keys(BRANDING_PROFILES).includes(value)
}

/**
 * Resolves `APP_CONFIG.BRANDING_PROFILE`, matched trimmed and case-insensitively. An absent or
 * unknown value falls back to the default with a warning, so a misconfigured deployment still
 * renders and the cause is visible in the console.
 */
export function resolveBrandingProfileId(configured: unknown): BrandingProfileId {
  const normalized = typeof configured === 'string' ? configured.trim().toLowerCase() : configured
  if (isBrandingProfileId(normalized)) return normalized

  const reason =
    configured === undefined ? 'is not set' : `"${String(configured)}" is not a known profile`
  console.warn(
    `[Config] APP_CONFIG.BRANDING_PROFILE ${reason}. Using "${DEFAULT_BRANDING_PROFILE_ID}".`
  )
  return DEFAULT_BRANDING_PROFILE_ID
}

let activeProfile: BrandingProfile | undefined

/**
 * Branding for this deployment's single-tenant header and footer.
 *
 * Resolved on first use rather than at import, so multi-tenant deployments, which never call
 * this, are not warned about a key they don't need.
 */
export function getBrandingProfile(): BrandingProfile {
  activeProfile ??= BRANDING_PROFILES[resolveBrandingProfileId(getRuntimeConfig().BRANDING_PROFILE)]
  return activeProfile
}
