// Runtime configuration
// This file can be replaced at deployment time
// to configure the application without rebuilding

window.APP_CONFIG = {
  API_BASE_URL: 'https://jalsoochak.beehyv.com',
  SINGLE_TENANT_MODE: false,
  CAPTCHA_ENABLED: false,
  RECAPTCHA_SITE_KEY: '',
  DEFAULT_AVERAGE_MEMBERS_PER_HOUSEHOLD: 5,
  DEFAULT_WATER_NORM_LITERS_PER_PERSON_PER_DAY: 55,
  ANALYTICS_SCHEME_STATUS_CRITICAL_AFTER_DAYS: 5,
  MAP_LEGEND_THRESHOLD_GTE_90: 90,
  MAP_LEGEND_THRESHOLD_GTE_70: 70,
  MAP_LEGEND_THRESHOLD_GTE_50: 50,
  MAP_LEGEND_THRESHOLD_GTE_30: 30,
  MAP_LEGEND_THRESHOLD_GTE_0: 0,
  SHOW_SUPPLY_OUTAGE_CHARTS: false,
  SHOW_STAFF_OVERVIEW_SUPPLY_OUTAGE_CHARTS: false,
  SHOW_STAFF_OVERVIEW_NON_SUBMISSION_CHARTS: false,
  DEFAULT_DASHBOARD_DURATION: {
    DAYS: 1,
    ALLOWED_DAYS: [1, 7, 30],
  },
  // Enables GA4 analytics and the footer visitor counter. Leave commented out on dev and
  // staging: without it no events are sent, no visitor is counted, and the Firebase SDK is
  // never downloaded. Uncomment only in the production config.js.
  // FIREBASE: {
  //   apiKey: 'AIzaSyApBmrfGSe65r2LeqULrj7X1S1vE1uLS6I',
  //   authDomain: 'jalsoochak-dashboard-assam.firebaseapp.com',
  //   projectId: 'jalsoochak-dashboard-assam',
  //   storageBucket: 'jalsoochak-dashboard-assam.firebasestorage.app',
  //   messagingSenderId: '808570519648',
  //   appId: '1:808570519648:web:1db8fc092dfb78e7f70305',
  //   measurementId: 'G-ZVV8XJLMEJ',
  // },
}
