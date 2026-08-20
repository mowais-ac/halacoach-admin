export const config = {
  appName: 'HalaCoach Admin',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? '',
  sessionCookie: 'hc_admin_session',
  apiTokenCookie: 'hc_admin_api_token',
} as const;
