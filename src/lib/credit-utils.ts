import type {
  CreditLedgerEntry,
  CreditPurchase,
  CreditsOverview,
  Professional,
  PromoCode,
} from '@/api/types';
import type {CreditPack} from '@/api/types';
import type {AppSettings} from '@/api/lookups';

export function buildCreditLedger(
  professionals: Professional[],
  purchases: CreditPurchase[],
): CreditLedgerEntry[] {
  const purchaseByTxn = new Map(purchases.map(item => [item.txnId, item]));
  const entries: CreditLedgerEntry[] = [];

  for (const pro of professionals) {
    for (const txn of pro.txns) {
      const purchase = purchaseByTxn.get(txn.id);
      entries.push({
        id: txn.id,
        professionalId: pro.id,
        professionalName: pro.name,
        type: txn.type,
        credits: txn.credits,
        label: txn.label,
        at: txn.at,
        orderId: purchase?.orderId,
        totalAed: purchase?.totalAed,
      });
    }
  }

  return entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export function buildCreditsOverview(input: {
  settings: AppSettings;
  packs: CreditPack[];
  promos: PromoCode[];
  professionals: Professional[];
  purchases: CreditPurchase[];
}): CreditsOverview {
  const transactions = buildCreditLedger(input.professionals, input.purchases);
  return {
    vatRate: input.settings.vatRate,
    packs: input.packs,
    promos: input.promos,
    transactions,
    stats: {
      totalCreditsInWallets: input.professionals.reduce((sum, pro) => sum + pro.credits, 0),
      purchaseCount: transactions.filter(item => item.type === 'purchase').length,
      spendCount: transactions.filter(item => item.type === 'spend').length,
    },
  };
}

export function formatAed(amount: number) {
  return `AED ${amount.toLocaleString('en-AE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

export function formatDiscount(rate: number) {
  return `${Math.round(rate * 100)}% off`;
}
