import {request} from '@/lib/request';
import type {CreditPackage, CreateCreditPackageInput, UpdateCreditPackageInput} from '@/api/types';

// ── Credit Packages ───────────────────────────────────────────────────────────

export function listCreditPackages() {
  return request<CreditPackage[]>('/v1/credit-packages');
}

export function createCreditPackage(input: CreateCreditPackageInput) {
  return request<CreditPackage>('/v1/credit-packages', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateCreditPackage(id: string, input: UpdateCreditPackageInput) {
  return request<CreditPackage>(`/v1/credit-packages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
