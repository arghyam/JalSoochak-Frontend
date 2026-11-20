import dwssPunjabLogo from '@/assets/media/dwss-punjab-logo.png'
import jjmLogo from '@/assets/media/jjm_new_logo.svg'
import type { BrandingProfile } from './branding-profile'

export const PUNJAB_BRANDING: BrandingProfile = {
  header: {
    // Full-colour logo, so it is not inverted on the dark header.
    emblem: {
      src: dwssPunjabLogo,
      alt: 'Department of Water Supply and Sanitation, Punjab logo',
      invertOnDark: false,
    },
    governmentLine: 'Government of Punjab',
    departmentLine: 'Department of Water Supply and Sanitation',
    missionLine: 'ਜਲ ਜੀਵਨ ਮਿਸ਼ਨ (Jal Jeevan Mission)',
    partnerLogo: { src: jjmLogo, alt: 'Jal Jeevan Mission logo' },
  },
  footer: {
    // TODO(punjab-pilot): add the department's social links.
    socialLinks: [],
    quickLinks: [
      {
        key: 'dwss-punjab-website',
        labelKey: 'branding.punjab.departmentWebsite',
        href: 'https://dwss.punjab.gov.in/',
      },
    ],
    // TODO(punjab-pilot): replace the placeholder contact details, and the matching
    // `branding.punjab.*` locale strings, with ones verified by the department.
    contact: {
      email: 'TODO: Punjab contact email',
      phoneKey: 'branding.punjab.phone',
      addressKey: 'branding.punjab.address',
    },
    copyrightOrg: {
      labelKey: 'branding.punjab.copyrightOrg',
      href: 'https://dwss.punjab.gov.in/',
    },
  },
}
