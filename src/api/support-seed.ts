import type {SupportTicket} from './types';

export const seedSupportTickets: SupportTicket[] = [
  {
    id: 'sup-1001',
    userType: 'client',
    userId: 'client-yasmin',
    subject: 'Help with matching',
    body:
      'I completed the questionnaire but only see two coaches in Dubai Marina. Can someone review my answers and suggest better matches?',
    status: 'new',
    replyNote: null,
    repliedAt: null,
    repliedBy: null,
    closedAt: null,
    createdAt: '2026-08-18T09:15:00.000Z',
  },
  {
    id: 'sup-1002',
    userType: 'client',
    userId: 'client-reem',
    subject: 'Coach gender preference ignored',
    body:
      'I selected a female coach only but received a match notification for a male trainer. Please check my profile settings.',
    status: 'replied',
    replyNote:
      'Thanks Reem — we refreshed your matches and removed coaches that do not match your gender preference. You should see updated results within the hour.',
    repliedAt: '2026-08-16T11:40:00.000Z',
    repliedBy: 'Omar Support',
    closedAt: null,
    createdAt: '2026-08-15T16:20:00.000Z',
  },
  {
    id: 'sup-1003',
    userType: 'professional',
    userId: 'amina-h',
    subject: 'Credits missing after checkout',
    body:
      'I purchased the Growth pack yesterday via Apple Pay. The payment went through but my wallet still shows 24 credits instead of 54.',
    status: 'new',
    replyNote: null,
    repliedAt: null,
    repliedBy: null,
    closedAt: null,
    createdAt: '2026-08-17T20:05:00.000Z',
  },
  {
    id: 'sup-1004',
    userType: 'client',
    userId: 'client-tariq',
    subject: 'Delete my account',
    body:
      'Please delete my HalaCoach account and remove my personal data. I no longer need coaching services.',
    status: 'closed',
    replyNote:
      'Account deletion request processed. Profile anonymised and matching data removed per privacy policy.',
    repliedAt: '2026-08-10T14:00:00.000Z',
    repliedBy: 'HalaCoach Admin',
    closedAt: '2026-08-10T14:05:00.000Z',
    createdAt: '2026-08-09T09:30:00.000Z',
  },
  {
    id: 'sup-1005',
    userType: 'professional',
    userId: 'leila-k',
    subject: 'Cannot re-upload verification documents',
    body:
      'My verification was rejected but the upload screen keeps failing when I select PDF files from my phone.',
    status: 'replied',
    replyNote:
      'Please try again on Wi‑Fi with files under 5 MB. We reset your verification slot — you can resubmit from Settings → Verification.',
    repliedAt: '2026-08-14T08:25:00.000Z',
    repliedBy: 'Noura Reviewer',
    closedAt: null,
    createdAt: '2026-08-13T19:50:00.000Z',
  },
];
