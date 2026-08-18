export type LookupGroupId =
  | 'goals'
  | 'trainingType'
  | 'frequency'
  | 'startTraining'
  | 'days'
  | 'times'
  | 'routine'
  | 'coachGender'
  | 'coachingStyle'
  | 'languages'
  | 'clientGender'
  | 'age'
  | 'ethnicity'
  | 'gymAccess'
  | 'proLocationTypes'
  | 'docTypes'
  | 'verificationStatus'
  | 'quoteRequestStatus'
  | 'creditTxnType'
  | 'paymentMethod';

export type LookupOption = {
  id: string;
  groupId: LookupGroupId;
  value: string;
  label: string;
  sortOrder: number;
  active: boolean;
  system: boolean;
};

export type LookupGroupMeta = {
  id: LookupGroupId;
  title: string;
  hint: string;
  /** System enums: labels can change, values cannot be added or removed. */
  locked: boolean;
};

export type AppSettings = {
  otpLength: number;
  otpResendSeconds: number;
  defaultPhonePrefix: string;
  vatRate: number;
  maxGoals: number;
};
