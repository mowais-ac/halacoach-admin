import type {Professional, ProfessionalSummary, VerificationQueueItem} from '@/api/types';

export function profileCompletion(pro: Professional): number {
  const checks = [
    Boolean(pro.name && pro.email),
    pro.serviceSlugs.length > 0,
    pro.locations.length > 0,
    pro.certificationFiles.length > 0,
    pro.insuranceFiles.length > 0,
    pro.credits > 0,
    pro.activated,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function toProfessionalSummary(pro: Professional): ProfessionalSummary {
  return {
    id: pro.id,
    name: pro.name,
    email: pro.email,
    phone: pro.phone,
    specialty: pro.specialty,
    location: pro.location,
    serviceCount: pro.serviceSlugs.length,
    verification: pro.verification,
    credits: pro.credits,
    activated: pro.activated,
    suspended: pro.suspended,
    profileCompletion: profileCompletion(pro),
  };
}

export function toVerificationQueueItem(pro: Professional): VerificationQueueItem {
  return {
    id: pro.id,
    name: pro.name,
    email: pro.email,
    phone: pro.phone,
    specialty: pro.specialty,
    location: pro.location,
    submittedAt: pro.verificationSubmittedAt ?? pro.createdAt,
    certificationFiles: pro.certificationFiles,
    insuranceFiles: pro.insuranceFiles,
    serviceSlugs: pro.serviceSlugs,
    profileCompletion: profileCompletion(pro),
    profileCertifications: pro.profileCertifications,
  };
}

export const verificationLabels = {
  none: 'None',
  pending: 'Pending',
  verified: 'Verified',
  rejected: 'Rejected',
} as const;

export const locationLabels: Record<string, string> = {
  mine: 'My location',
  client: 'Client location',
  online: 'Online',
};
