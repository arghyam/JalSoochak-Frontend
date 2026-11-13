import sealOfAssam from '@/assets/media/Seal_of_Assam.svg'
import jjmLogo from '@/assets/media/jjm_new_logo.svg'
import type { BrandingProfile } from './branding-profile'

export const ASSAM_BRANDING: BrandingProfile = {
  header: {
    emblem: { src: sealOfAssam, alt: 'Government of Assam Seal', invertOnDark: true },
    governmentLine: 'Government of Assam',
    departmentLine: 'Public Health Engineering Department',
    missionLine: 'জল জীৱন মিছন (Jal Jeevan Mission)',
    partnerLogo: { src: jjmLogo, alt: 'Jal Jeevan Mission logo' },
  },
  footer: {
    socialLinks: [
      { network: 'x', href: 'https://x.com/JJM_Assam' },
      { network: 'linkedin', href: 'https://www.linkedin.com/company/jjmassam/' },
      { network: 'email', href: 'mailto:md@jjmassam.in' },
    ],
    quickLinks: [
      {
        key: 'phed-assam-website',
        labelKey: 'branding.assam.departmentWebsite',
        href: 'https://jjmassam.in/',
      },
      {
        key: 'jjm-assam-website',
        labelKey: 'branding.assam.missionWebsite',
        href: 'https://jjmbrain.in/',
      },
    ],
    contact: {
      email: 'md@jjmassam.in',
      phoneKey: 'branding.assam.phone',
      addressKey: 'branding.assam.address',
    },
    copyrightOrg: { labelKey: 'branding.assam.copyrightOrg', href: 'https://jjmassam.in/' },
  },
}
