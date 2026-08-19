import {request} from '@/lib/request';
import type {
  CreditPackage,
  CreateCreditPackageInput,
  CreatePromoInput,
  PromoCode,
  UpdateCreditPackageInput,
  UpdatePromoInput,
} from '@/api/types';

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

// ── Promo Codes ───────────────────────────────────────────────────────────────

export function listPromoCodes() {
  return request<PromoCode[]>('/v1/promo-codes');
}

export function createPromoCode(input: CreatePromoInput) {
  return request<PromoCode>('/v1/promo-codes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updatePromoCode(id: string, input: UpdatePromoInput) {
  return request<PromoCode>(`/v1/promo-codes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
