import type {Conversation} from './types';

const conversationId = 'conv-reem-amina';

export const seedConversations: Conversation[] = [
  {
    id: conversationId,
    clientId: 'client-reem',
    professionalId: 'amina-h',
    createdAt: '2026-08-12T11:00:00.000Z',
    updatedAt: '2026-08-13T19:45:00.000Z',
    messages: [
      {
        id: 'msg-1',
        conversationId,
        author: 'professional',
        body:
          'Pre/postnatal-friendly weight loss plan with 3 morning sessions. Gym or Dubai Marina outdoor options.',
        sentAt: '2026-08-12T11:00:00.000Z',
      },
      {
        id: 'msg-2',
        conversationId,
        author: 'client',
        body: 'Hi Amina! I train 3x a week, mostly evenings. Can we start next Monday?',
        sentAt: '2026-08-13T09:20:00.000Z',
      },
      {
        id: 'msg-3',
        conversationId,
        author: 'professional',
        body:
          "Perfect — Monday 7:00 PM works. I'll send a short intake form before our first session.",
        sentAt: '2026-08-13T19:45:00.000Z',
      },
    ],
  },
];
