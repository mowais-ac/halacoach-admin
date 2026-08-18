export const config = {
  appName: 'HalaCoach Admin',
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? '',
  useMocks: process.env.NEXT_PUBLIC_USE_MOCKS !== 'false',
  sessionCookie: 'hc_admin_session',
} as const;
