export const config = {
  appName: 'HalaCoach Admin',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? '',
  useMocks: process.env.NEXT_PUBLIC_USE_MOCKS !== 'false',
  sessionCookie: 'hc_admin_session',
} as const;
