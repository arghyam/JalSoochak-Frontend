import dwssPunjabLogo from '@/assets/media/dwss-punjab-logo.png'
import jjmLogo from '@/assets/media/jjm_new_logo.svg'
import { ARGHYAM_SOCIAL_LINKS } from './arghyam-social-links'
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
    socialLinks: ARGHYAM_SOCIAL_LINKS,
    quickLinks: [
      {
        key: 'dwss-punjab-website',
        labelKey: 'branding.punjab.departmentWebsite',
        href: 'https://dwss.punjab.gov.in/',
      },
    ],
    contact: null,
    copyrightOrg: {
      labelKey: 'branding.punjab.copyrightOrg',
      href: 'https://dwss.punjab.gov.in/',
    },
  },
}
