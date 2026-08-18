import type {AppSettings, LookupGroupId, LookupGroupMeta, LookupOption} from './lookups';

export const lookupGroups: LookupGroupMeta[] = [
  {
    id: 'goals',
    title: 'Goals',
    hint: 'Client matching step 1. App enforces max goals separately.',
    locked: false,
  },
  {
    id: 'trainingType',
    title: 'Training type',
    hint: 'In-person, online, or both.',
    locked: false,
  },
  {
    id: 'frequency',
    title: 'Training frequency',
    hint: 'How often the client wants to train.',
    locked: false,
  },
  {
    id: 'startTraining',
    title: 'When to start',
    hint: 'Added beyond the original 13-step flow.',
    locked: false,
  },
  {
    id: 'days',
    title: 'Preferred days',
    hint: 'Multi-select. “Any” is exclusive in the app.',
    locked: false,
  },
  {
    id: 'times',
    title: 'Preferred times',
    hint: '“Other” shows a free-text field in the app.',
    locked: false,
  },
  {
    id: 'routine',
    title: 'Current exercise routine',
    hint: '“Other” shows a free-text field in the app.',
    locked: false,
  },
  {
    id: 'coachGender',
    title: 'Coach gender preference',
    hint: 'Client preference for the professional.',
    locked: false,
  },
  {
    id: 'coachingStyle',
    title: 'Coaching style',
    hint: 'What motivates the client.',
    locked: false,
  },
  {
    id: 'languages',
    title: 'Languages',
    hint: 'Languages the client is comfortable with.',
    locked: false,
  },
  {
    id: 'clientGender',
    title: 'Client gender',
    hint: 'Personal details step.',
    locked: false,
  },
  {
    id: 'age',
    title: 'Age ranges',
    hint: 'Personal details step.',
    locked: false,
  },
  {
    id: 'ethnicity',
    title: 'Ethnicity',
    hint: 'Added on prototype-v2. Keep a prefer-not option.',
    locked: false,
  },
  {
    id: 'gymAccess',
    title: 'Gym access',
    hint: 'Yes / no.',
    locked: false,
  },
  {
    id: 'proLocationTypes',
    title: 'Pro training locations',
    hint: 'My location, client location, online. Client location uses radius km.',
    locked: false,
  },
  {
    id: 'docTypes',
    title: 'Verification document types',
    hint: 'ID, CPR, REPs UAE, specialty, sub-specialty, insurance.',
    locked: false,
  },
  {
    id: 'verificationStatus',
    title: 'Verification status',
    hint: 'Used by the coach profile and admin queue. Do not add extra values.',
    locked: true,
  },
  {
    id: 'quoteRequestStatus',
    title: 'Quote request status',
    hint: 'Client Request Quote pipeline.',
    locked: true,
  },
  {
    id: 'creditTxnType',
    title: 'Credit transaction types',
    hint: 'Wallet ledger.',
    locked: true,
  },
  {
    id: 'paymentMethod',
    title: 'Payment methods',
    hint: 'Card and Apple Pay only. Bank transfer is not in the app.',
    locked: true,
  },
];

function opts(
  groupId: LookupGroupId,
  items: [string, string][],
  system = false,
): LookupOption[] {
  return items.map(([value, label], index) => ({
    id: `${groupId}-${value}`,
    groupId,
    value,
    label,
    sortOrder: index + 1,
    active: true,
    system,
  }));
}

export const seedLookups: LookupOption[] = [
  ...opts('goals', [
    ['lose-weight', 'Lose weight'],
    ['build-muscle', 'Build muscle'],
    ['get-stronger', 'Get stronger'],
    ['improve-health', 'Improve health'],
    ['rehab', 'Rehab / injury'],
    ['sport-beginner', 'Learn a sport (beginner)'],
    ['sport-advanced', 'Master a sport (advanced)'],
  ]),
  ...opts('trainingType', [
    ['in-person', 'In-person'],
    ['online', 'Online'],
    ['both', 'Both'],
  ]),
  ...opts('frequency', [
    ['1-2', '1–2 times/week'],
    ['3-4', '3–4 times/week'],
    ['5+', '5+ times/week'],
  ]),
  ...opts('startTraining', [
    ['asap', 'As soon as possible'],
    ['next-week', 'Next week'],
    ['two-weeks', 'In 2 weeks'],
    ['month', 'Within a month'],
    ['few-months', 'Within a few months'],
  ]),
  ...opts('days', [
    ['any', 'Any day'],
    ['mon', 'Monday'],
    ['tue', 'Tuesday'],
    ['wed', 'Wednesday'],
    ['thu', 'Thursday'],
    ['fri', 'Friday'],
    ['sat', 'Saturday'],
    ['sun', 'Sunday'],
  ]),
  ...opts('times', [
    ['any', 'Any time'],
    ['early-morning', 'Early morning (before 9am)'],
    ['morning', 'Morning (9am–noon)'],
    ['early-afternoon', 'Early afternoon (noon–3pm)'],
    ['late-afternoon', 'Late afternoon (3–6pm)'],
    ['evening', 'Evening (after 6pm)'],
    ['other', 'Other'],
  ]),
  ...opts('routine', [
    ['none', 'I don’t exercise at all'],
    ['hour', 'I exercise for around an hour a week'],
    ['couple', 'I exercise a couple of times a week'],
    ['other', 'Other'],
  ]),
  ...opts('coachGender', [
    ['any', 'No preference'],
    ['male', 'Male'],
    ['female', 'Female'],
  ]),
  ...opts('coachingStyle', [
    ['strict', 'Strict / disciplined'],
    ['supportive', 'Supportive / encouraging'],
    ['educational', 'Educational / explanatory'],
  ]),
  ...opts('languages', [
    ['en', 'English'],
    ['ar', 'Arabic'],
  ]),
  ...opts('clientGender', [
    ['female', 'Female'],
    ['male', 'Male'],
  ]),
  ...opts('age', [
    ['u18', 'Younger than 18'],
    ['18-22', '18–22 years old'],
    ['23-29', '23–29 years old'],
    ['30-39', '30–39 years old'],
    ['40-49', '40–49 years old'],
    ['50-59', '50–59 years old'],
    ['60+', '60 or older'],
  ]),
  ...opts('ethnicity', [
    ['middle-eastern', 'Middle Eastern / Arab'],
    ['south-asian', 'South Asian'],
    ['prefer-not', 'Other / prefer not to say'],
  ]),
  ...opts('gymAccess', [
    ['yes', 'Yes'],
    ['no', 'No'],
  ]),
  ...opts('proLocationTypes', [
    ['mine', 'My location'],
    ['client', 'Client location'],
    ['online', 'Online'],
  ]),
  ...opts('docTypes', [
    ['id', 'ID'],
    ['cpr', 'CPR'],
    ['reps-uae', 'REPs UAE'],
    ['specialty', 'Specialty'],
    ['sub-specialty', 'Sub-specialty'],
    ['insurance', 'Insurance (optional)'],
  ]),
  ...opts(
    'verificationStatus',
    [
      ['none', 'None'],
      ['pending', 'Pending'],
      ['verified', 'Verified'],
      ['rejected', 'Rejected'],
    ],
    true,
  ),
  ...opts(
    'quoteRequestStatus',
    [
      ['pending', 'Pending'],
      ['quoted', 'Quoted'],
      ['closed', 'Closed'],
    ],
    true,
  ),
  ...opts(
    'creditTxnType',
    [
      ['purchase', 'Purchase'],
      ['spend', 'Spend'],
      ['adjustment', 'Adjustment'],
    ],
    true,
  ),
  ...opts(
    'paymentMethod',
    [
      ['card', 'Credit or debit card'],
      ['applepay', 'Apple Pay'],
    ],
    true,
  ),
];

export const seedSettings: AppSettings = {
  otpLength: 4,
  otpResendSeconds: 30,
  defaultPhonePrefix: '+971',
  vatRate: 0.05,
  maxGoals: 2,
};
