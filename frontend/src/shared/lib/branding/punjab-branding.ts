import jalsoochakLogo from '@/assets/media/logo.svg'
import jjmLogo from '@/assets/media/jjm_new_logo.svg'
import type { BrandingProfile } from './branding-profile'

// TODO(punjab-pilot): replace every placeholder below, and the `branding.punjab.*` locale
// strings, with content verified by the Punjab department before the pilot goes live.
export const PUNJAB_BRANDING: BrandingProfile = {
  header: {
    // TODO(punjab-pilot): placeholder image; add the Punjab seal to src/assets/media and set
    // invertOnDark to true if it is a single-colour seal.
    emblem: { src: jalsoochakLogo, alt: 'Government of Punjab Seal', invertOnDark: false },
    governmentLine: 'Government of Punjab',
    // TODO(punjab-pilot): confirm the department name and the Gurmukhi mission line.
    departmentLine: 'Department of Water Supply and Sanitation',
    missionLine: 'ਜਲ ਜੀਵਨ ਮਿਸ਼ਨ (Jal Jeevan Mission)',
    partnerLogo: { src: jjmLogo, alt: 'Jal Jeevan Mission logo' },
  },
  footer: {
    // TODO(punjab-pilot): add the department's social links and websites.
    socialLinks: [],
    quickLinks: [],
    contact: {
      email: 'TODO: Punjab contact email',
      phoneKey: 'branding.punjab.phone',
      addressKey: 'branding.punjab.address',
    },
    // TODO(punjab-pilot): link to the department's website.
    copyrightOrg: { labelKey: 'branding.punjab.copyrightOrg', href: 'https://punjab.gov.in/' },
  },
}
