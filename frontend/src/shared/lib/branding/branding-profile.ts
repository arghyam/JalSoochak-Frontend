import type { SocialNetwork } from '@/shared/lib/analytics'

/**
 * State-specific content of the public dashboard header and footer in single-tenant mode.
 *
 * Profiles are plain data: components own the layout, and translatable text is referenced by
 * i18n key (`common` namespace) so every locale stays in the locale files.
 */
export interface BrandingProfile {
  header: BrandingHeader
  footer: BrandingFooter
}

export interface BrandingImage {
  src: string
  alt: string
}

export interface BrandingHeader {
  /** State emblem shown on the left; links to the dashboard home. */
  emblem: BrandingImage & {
    /** Render the emblem white, for single-colour seals on the dark header. */
    invertOnDark: boolean
  }
  /**
   * Heading lockup beside the emblem. Fixed strings, not translated: like the emblem, the
   * lockup reads the same in every UI language.
   */
  governmentLine: string
  departmentLine: string
  missionLine: string
  /** Programme logo shown on the right. */
  partnerLogo: BrandingImage
}

export interface BrandingSocialLink {
  network: SocialNetwork
  href: string
}

export interface BrandingQuickLink {
  /** Stable analytics key, independent of the translated label. */
  key: string
  labelKey: string
  href: string
}

export interface BrandingFooter {
  socialLinks: readonly BrandingSocialLink[]
  /** External links listed after the shared JalSoochak website link. */
  quickLinks: readonly BrandingQuickLink[]
  contact: {
    /** Not translated: an address reads the same in every language. */
    email: string
    phoneKey: string
    addressKey: string
  }
  /** Organisation credited in the copyright line. */
  copyrightOrg: {
    labelKey: string
    href: string
  }
}
