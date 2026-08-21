import type {Client, ClientSummary} from '@/api/types';
import type {LookupOption} from '@/api/lookups';

export function toClientSummary(client: Client): ClientSummary {
  return {
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    location: client.answers.location ?? '—',
    goals: client.answers.goal,
    onboarded: client.onboarded,
    otpVerified: client.otpVerified,
    suspended: client.suspended,
    savedCount: client.savedCoachIds.length,
    createdAt: client.createdAt,
    lastActiveAt: client.lastActiveAt,
  };
}

type AnswerRow = {
  step: number;
  label: string;
  value: string;
};

function labelFor(lookups: LookupOption[], groupId: string, value: string) {
  return lookups.find(item => item.groupId === groupId && item.value === value)?.label ?? value;
}

function labelsFor(lookups: LookupOption[], groupId: string, values: string[]) {
  return values.map(value => labelFor(lookups, groupId, value)).join(', ');
}

/** Steps aligned with live mobile MatchScreen onboarding (14 steps). */
export function clientAnswerRows(client: Client, lookups: LookupOption[]): AnswerRow[] {
  const answers = client.answers;
  return [
    {step: 1, label: 'Goals', value: labelsFor(lookups, 'goals', answers.goal) || '—'},
    {
      step: 2,
      label: 'Training type',
      value: answers.trainingType
        ? labelFor(lookups, 'trainingType', answers.trainingType)
        : '—',
    },
    {
      step: 3,
      label: 'Frequency',
      value: answers.frequency ? labelFor(lookups, 'frequency', answers.frequency) : '—',
    },
    {step: 4, label: 'Preferred days', value: labelsFor(lookups, 'days', answers.days) || '—'},
    {
      step: 5,
      label: 'Preferred times',
      value:
        (labelsFor(lookups, 'times', answers.times) || '—') +
        (answers.timesOther ? ` (${answers.timesOther})` : ''),
    },
    {
      step: 6,
      label: 'Current routine',
      value:
        (answers.routine ? labelFor(lookups, 'routine', answers.routine) : '—') +
        (answers.routineOther ? ` (${answers.routineOther})` : ''),
    },
    {
      step: 7,
      label: 'Coach gender preference',
      value: answers.coachGender ? labelFor(lookups, 'coachGender', answers.coachGender) : '—',
    },
    {
      step: 8,
      label: 'Coaching style',
      value: answers.style ? labelFor(lookups, 'coachingStyle', answers.style) : '—',
    },
    {
      step: 9,
      label: 'Personal details',
      value: [
        answers.gender ? labelFor(lookups, 'clientGender', answers.gender) : null,
        answers.age ? labelFor(lookups, 'age', answers.age) : null,
        answers.gymAccess ? labelFor(lookups, 'gymAccess', answers.gymAccess) : null,
      ]
        .filter(Boolean)
        .join(' · ') || '—',
    },
    {
      step: 10,
      label: 'Languages',
      value: labelsFor(lookups, 'languages', answers.languages) || '—',
    },
    {
      step: 11,
      label: 'Ethnicity',
      value: answers.ethnicity ? labelFor(lookups, 'ethnicity', answers.ethnicity) : '—',
    },
    {
      step: 12,
      label: 'When to start',
      value: answers.startTraining
        ? labelFor(lookups, 'startTraining', answers.startTraining)
        : '—',
    },
    {step: 13, label: 'Location', value: answers.location ?? '—'},
    {
      step: 14,
      label: 'Account',
      value: [answers.email, answers.phone].filter(Boolean).join(' · ') || '—',
    },
  ];
}

export const consentLabels = {
  terms: 'Terms of Service',
  privacy: 'Privacy Policy',
  independent: 'Independent professionals / coach agreement',
  contact: 'Contact by matching coaches',
} as const;
