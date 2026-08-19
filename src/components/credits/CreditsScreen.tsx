'use client';

import {FormEvent, useEffect, useMemo, useState} from 'react';
import {
  adjustCredits,
  createPromoCode,
  getCreditsOverview,
  isApiError,
  listProfessionals,
  updatePromoCode,
  type CreditsOverview,
  type ProfessionalSummary,
  type SessionUser,
} from '@/api';
import {createCreditPackage, listCreditPackages, updateCreditPackage} from '@/lib/apis';
import type {CreditPackage, CreditPackageBadge} from '@/api/types';
import {Badge} from '@/components/ui/Badge';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {ConfirmDialog} from '@/components/ui/ConfirmDialog';
import {DataTable, FilterBar} from '@/components/ui/DataTable';
import {EmptyState} from '@/components/ui/EmptyState';
import {ErrorState} from '@/components/ui/ErrorState';
import {Input} from '@/components/ui/Input';
import {LoadingState} from '@/components/ui/LoadingState';
import {PageHeader} from '@/components/ui/PageHeader';
import {formatAed, formatDiscount} from '@/lib/credit-utils';
import {cn} from '@/lib/cn';
import {can} from '@/lib/permissions';

type TxnFilter = 'all' | 'purchase' | 'spend' | 'adjustment';

type CreditPackageDraft = {
  name: string;
  credits: string;
  price: string;
  badge: CreditPackageBadge | '';
};

type PromoDraft = {
  code: string;
  discountRate: string;
};

const emptyCreditPackageForm: CreditPackageDraft = {name: '', credits: '', price: '', badge: ''};
const emptyPromoForm: PromoDraft = {code: '', discountRate: '10'};

const tableInputClass =
  'h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-primary';
const tableSelectClass =
  'h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-primary';
const creditPackageTableCellClass = 'flex h-9 items-center';
const creditPackageActionButtonClass = 'w-[4.75rem] shrink-0 justify-center';
const creditPackageArchiveButtonClass = 'min-w-[5.5rem] shrink-0 justify-center';

function CreditPackageTableCell({children, className}: {children: React.ReactNode; className?: string}) {
  return <div className={cn(creditPackageTableCellClass, className)}>{children}</div>;
}

function CatalogActions({
  isEditing,
  saving,
  onCancel,
  onSave,
  onEdit,
  toggleLabel,
  onToggle,
}: {
  isEditing: boolean;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
  onEdit: () => void;
  toggleLabel: string;
  onToggle: () => void;
}) {
  return (
    <CreditPackageTableCell className="justify-end gap-1">
      {isEditing ? (
        <Button size="sm" variant="outline" className={creditPackageActionButtonClass} onClick={onCancel}>
          Cancel
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className={cn(creditPackageActionButtonClass, 'invisible pointer-events-none')}
          tabIndex={-1}
          aria-hidden>
          Cancel
        </Button>
      )}
      {isEditing ? (
        <Button size="sm" className={creditPackageActionButtonClass} disabled={saving} onClick={onSave}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      ) : (
        <Button size="sm" variant="outline" className={creditPackageActionButtonClass} onClick={onEdit}>
          Edit
        </Button>
      )}
      <Button size="sm" variant="outline" className={creditPackageArchiveButtonClass} onClick={onToggle}>
        {toggleLabel}
      </Button>
    </CreditPackageTableCell>
  );
}

export function CreditsScreen({actor}: {actor: SessionUser}) {
  const canWrite = can(actor.role, 'credits:write');
  const canAdjust = can(actor.role, 'credits:adjust');
  const [overview, setOverview] = useState<CreditsOverview | null>(null);
  const [professionals, setProfessionals] = useState<ProfessionalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [packages, setPackages] = useState<{items: CreditPackage[]; isLoading: boolean; error: string | null}>({
    items: [],
    isLoading: true,
    error: null,
  });
  const [creditPackageDrafts, setCreditPackageDrafts] = useState<Record<string, CreditPackageDraft>>({});
  const [creditPackageForm, setCreditPackageForm] = useState<CreditPackageDraft>(emptyCreditPackageForm);
  const [creditPackageError, setCreditPackageError] = useState<string | null>(null);
  const [savingCreditPackage, setSavingCreditPackage] = useState<string | null>(null);
  const [creatingCreditPackage, setCreatingCreditPackage] = useState(false);
  const [editingCreditPackageId, setEditingCreditPackageId] = useState<string | null>(null);
  const [txnFilter, setTxnFilter] = useState<TxnFilter>('all');
  const [promoDrafts, setPromoDrafts] = useState<Record<string, PromoDraft>>({});
  const [promoForm, setPromoForm] = useState<PromoDraft>(emptyPromoForm);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [savingPromo, setSavingPromo] = useState<string | null>(null);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    professionalId: '',
    credits: '',
    label: '',
  });
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState(false);
  const [pendingAdjust, setPendingAdjust] = useState(false);

  const loadPackages = async () => {
    setPackages(s => ({...s, isLoading: true, error: null}));
    try {
      const items = await listCreditPackages();
      setPackages({items, isLoading: false, error: null});
      setCreditPackageDrafts(
        Object.fromEntries(
          items.map(pkg => [
            pkg.id,
            {
              name: pkg.name,
              credits: String(pkg.credits),
              price: String(pkg.price),
              badge: pkg.badge ?? '',
            },
          ]),
        ),
      );
    } catch (err) {
      setPackages(s => ({...s, isLoading: false, error: isApiError(err) ? err.message : 'Could not load packages.'}));
    }
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [credits, pros] = await Promise.all([getCreditsOverview(), listProfessionals()]);
      setOverview(credits);
      setProfessionals(pros);
      setPromoDrafts(
        Object.fromEntries(
          credits.promos.map(promo => [
            promo.id,
            {
              code: promo.code,
              discountRate: String(Math.round(promo.discountRate * 100)),
            },
          ]),
        ),
      );
      if (!adjustForm.professionalId && pros[0]) {
        setAdjustForm(form => ({...form, professionalId: pros[0]!.id}));
      }
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Could not load credits module.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPackages();
    void load();
  }, []);

  const transactions = useMemo(() => {
    if (!overview) {
      return [];
    }
    if (txnFilter === 'all') {
      return overview.transactions;
    }
    return overview.transactions.filter(item => item.type === txnFilter);
  }, [overview, txnFilter]);

  const saveCreditPackage = async (packId: string) => {
    const draft = creditPackageDrafts[packId];
    const credits = Number(draft?.credits);
    const price = Number(draft?.price);
    const name = draft?.name.trim() ?? '';
    if (!name) {
      setError('Credit package name cannot be empty.');
      return;
    }
    if (!Number.isFinite(credits) || credits < 1) {
      setError('Each credit package needs at least 1 credit.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError('Enter a valid credit package price in AED.');
      return;
    }
    setSavingCreditPackage(packId);
    setError(null);
    try {
      await updateCreditPackage(packId, {
        name,
        credits,
        price,
        badge: draft.badge || null,
      });
      setEditingCreditPackageId(current => (current === packId ? null : current));
      await loadPackages();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Could not update credit package.');
    } finally {
      setSavingCreditPackage(null);
    }
  };

  const submitCreateCreditPackage = async () => {
    setCreditPackageError(null);
    const credits = Number(creditPackageForm.credits);
    const price = Number(creditPackageForm.price);
    if (!creditPackageForm.name.trim()) {
      setCreditPackageError('Name is required.');
      return;
    }
    if (!Number.isFinite(credits) || credits < 1) {
      setCreditPackageError('Credits must be at least 1.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setCreditPackageError('Price must be greater than zero.');
      return;
    }
    setCreatingCreditPackage(true);
    try {
      await createCreditPackage({
        name: creditPackageForm.name.trim(),
        credits,
        price,
        badge: creditPackageForm.badge || null,
      });
      setCreditPackageForm(emptyCreditPackageForm);
      await loadPackages();
    } catch (err) {
      setCreditPackageError(isApiError(err) ? err.message : 'Could not create credit package.');
    } finally {
      setCreatingCreditPackage(false);
    }
  };

  const startEditCreditPackage = (pack: CreditPackage) => {
    if (editingCreditPackageId && editingCreditPackageId !== pack.id) {
      const previous = packages.items.find(item => item.id === editingCreditPackageId);
      if (previous) {
        setCreditPackageDrafts(state => ({
          ...state,
          [previous.id]: {
            name: previous.name,
            credits: String(previous.credits),
            price: String(previous.price),
            badge: previous.badge ?? '',
          },
        }));
      }
    }
    setEditingCreditPackageId(pack.id);
    setCreditPackageDrafts(state => ({
      ...state,
      [pack.id]: {
        name: pack.name,
        credits: String(pack.credits),
        price: String(pack.price),
        badge: pack.badge ?? '',
      },
    }));
    setError(null);
  };

  const cancelEditCreditPackage = (pack: CreditPackage) => {
    setCreditPackageDrafts(state => ({
      ...state,
      [pack.id]: {
        name: pack.name,
        credits: String(pack.credits),
        price: String(pack.price),
        badge: pack.badge ?? '',
      },
    }));
    setEditingCreditPackageId(current => (current === pack.id ? null : current));
  };

  const toggleCreditPackage = async (packId: string, active: boolean) => {
    try {
      await updateCreditPackage(packId, {active});
      setEditingCreditPackageId(current => (current === packId ? null : current));
      await loadPackages();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Could not update credit package.');
    }
  };

  const togglePromo = async (id: string, active: boolean) => {
    try {
      await updatePromoCode(id, {active});
      setEditingPromoId(current => (current === id ? null : current));
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Could not update promo code.');
    }
  };

  const savePromo = async (promoId: string) => {
    const draft = promoDrafts[promoId];
    const code = draft?.code.trim().toUpperCase() ?? '';
    const discountRate = Number(draft?.discountRate);
    if (!code) {
      setError('Promo code cannot be empty.');
      return;
    }
    if (!Number.isFinite(discountRate) || discountRate < 1 || discountRate > 50) {
      setError('Discount must be between 1% and 50%.');
      return;
    }
    setSavingPromo(promoId);
    setError(null);
    try {
      await updatePromoCode(promoId, {
        code,
        discountRate: discountRate / 100,
      });
      setEditingPromoId(current => (current === promoId ? null : current));
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Could not update promo code.');
    } finally {
      setSavingPromo(null);
    }
  };

  const startEditPromo = (promo: CreditsOverview['promos'][number]) => {
    if (editingPromoId && editingPromoId !== promo.id) {
      const previous = overview?.promos.find(item => item.id === editingPromoId);
      if (previous) {
        setPromoDrafts(state => ({
          ...state,
          [previous.id]: {
            code: previous.code,
            discountRate: String(Math.round(previous.discountRate * 100)),
          },
        }));
      }
    }
    setEditingPromoId(promo.id);
    setPromoDrafts(state => ({
      ...state,
      [promo.id]: {
        code: promo.code,
        discountRate: String(Math.round(promo.discountRate * 100)),
      },
    }));
    setError(null);
  };

  const cancelEditPromo = (promo: CreditsOverview['promos'][number]) => {
    setPromoDrafts(state => ({
      ...state,
      [promo.id]: {
        code: promo.code,
        discountRate: String(Math.round(promo.discountRate * 100)),
      },
    }));
    setEditingPromoId(current => (current === promo.id ? null : current));
  };

  const submitCreatePromo = async () => {
    setPromoError(null);
    const code = promoForm.code.trim().toUpperCase();
    const discountRate = Number(promoForm.discountRate);
    if (!code) {
      setPromoError('Code is required.');
      return;
    }
    if (!Number.isFinite(discountRate) || discountRate < 1 || discountRate > 50) {
      setPromoError('Discount must be between 1% and 50%.');
      return;
    }
    try {
      await createPromoCode({code, discountRate: discountRate / 100});
      setPromoForm(emptyPromoForm);
      await load();
    } catch (err) {
      setPromoError(isApiError(err) ? err.message : 'Could not create promo code.');
    }
  };

  const onAdjust = (event: FormEvent) => {
    event.preventDefault();
    setAdjustError(null);
    const credits = Number(adjustForm.credits);
    if (!adjustForm.professionalId) {
      setAdjustError('Select a coach.');
      return;
    }
    if (!Number.isFinite(credits) || credits === 0) {
      setAdjustError('Enter a non-zero credit amount.');
      return;
    }
    setPendingAdjust(true);
  };

  const runAdjust = async () => {
    setAdjustError(null);
    setAdjusting(true);
    try {
      await adjustCredits({
        professionalId: adjustForm.professionalId,
        credits: Number(adjustForm.credits),
        label: adjustForm.label || undefined,
      });
      setAdjustForm(form => ({...form, credits: '', label: ''}));
      setPendingAdjust(false);
      await load();
    } catch (err) {
      setAdjustError(isApiError(err) ? err.message : 'Could not adjust credits.');
    } finally {
      setAdjusting(false);
    }
  };

  if (error && !overview && !loading) {
    return <ErrorState body={error} onRetry={() => void load()} />;
  }

  return (
    <>
      <PageHeader
        module="M9"
        title="Credits"
        description="Packs, promo codes, VAT, transactions, and wallet adjustments."
      />

      {error ? (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-destructive">{error}</p>
      ) : null}

      {!canWrite && !canAdjust ? (
        <p className="mb-4 rounded-xl bg-primary-soft px-4 py-3 text-sm text-primary-deep">
          View only — credit package prices and promo codes require super admin; adjustments require support or super.
        </p>
      ) : null}

      {loading ? (
        <LoadingState label="Loading credits…" />
      ) : overview ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-xs font-medium uppercase text-muted-foreground">In wallets</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {overview.stats.totalCreditsInWallets} credits
            </p>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase text-muted-foreground">Purchases</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{overview.stats.purchaseCount}</p>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase text-muted-foreground">Lead unlocks</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{overview.stats.spendCount}</p>
          </Card>
        </div>
      ) : null}

      <h2 className="mb-3 text-lg font-semibold text-foreground">Credit packages</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Catalog shown in the pro checkout. Add, edit, or archive credit packages — prices exclude VAT
        {overview ? `; ${Math.round(overview.vatRate * 100)}% is added at checkout` : ''}.
      </p>
      <div className="mb-8">
        <DataTable
          tableClassName="table-fixed"
          columnWidths={
            canWrite
              ? ['20%', '9%', '13%', '13%', '11%', '10%', '24%']
              : ['22%', '10%', '14%', '14%', '14%', '12%']
          }
          columns={
            canWrite
              ? ['Name', 'Credits', 'Price (excl. VAT)', 'Badge', 'Incl. VAT', 'Status', 'Actions']
              : ['Name', 'Credits', 'Price (excl. VAT)', 'Badge', 'Incl. VAT', 'Status']
          }>
          {packages.isLoading && packages.items.length === 0 ? (
            <tr>
              <td colSpan={canWrite ? 7 : 6} className="px-4 py-8 text-center">
                <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
              </td>
            </tr>
          ) : null}
          {packages.error ? (
            <tr>
              <td colSpan={canWrite ? 7 : 6} className="px-4 py-6 text-center">
                <p className="mb-2 text-sm text-destructive">{packages.error}</p>
                <button
                  className="text-xs text-primary underline"
                  onClick={() => void loadPackages()}>
                  Retry
                </button>
              </td>
            </tr>
          ) : null}
          {packages.items.map(pack => {
            const draft = creditPackageDrafts[pack.id] ?? {
              name: pack.name,
              credits: String(pack.credits),
              price: String(pack.price),
              badge: pack.badge ?? '',
            };
            const isEditing = canWrite && editingCreditPackageId === pack.id;
            const displayPrice = isEditing ? Number(draft.price) : pack.price;
            const inclVat = Number.isFinite(displayPrice) && overview
              ? formatAed(displayPrice * (1 + overview.vatRate))
              : '—';

            return (
              <tr
                key={pack.id}
                className={cn(
                  'border-b border-border last:border-0',
                  !pack.active && 'bg-muted/30',
                  isEditing && 'bg-primary-soft/30',
                )}>
                <td className="px-4 py-2">
                  <CreditPackageTableCell>
                    {isEditing ? (
                      <input
                        className={tableInputClass}
                        value={draft.name}
                        onChange={e =>
                          setCreditPackageDrafts(state => ({
                            ...state,
                            [pack.id]: {...draft, name: e.target.value},
                          }))
                        }
                      />
                    ) : (
                      <span className="truncate font-medium text-foreground">{pack.name}</span>
                    )}
                  </CreditPackageTableCell>
                </td>
                <td className="px-4 py-2">
                  <CreditPackageTableCell>
                    {isEditing ? (
                      <input
                        className={tableInputClass}
                        type="number"
                        min={1}
                        value={draft.credits}
                        onChange={e =>
                          setCreditPackageDrafts(state => ({
                            ...state,
                            [pack.id]: {...draft, credits: e.target.value},
                          }))
                        }
                      />
                    ) : (
                      <span className="text-foreground">{pack.credits}</span>
                    )}
                  </CreditPackageTableCell>
                </td>
                <td className="px-4 py-2">
                  <CreditPackageTableCell>
                    {isEditing ? (
                      <input
                        className={tableInputClass}
                        type="number"
                        min={1}
                        value={draft.price}
                        onChange={e =>
                          setCreditPackageDrafts(state => ({
                            ...state,
                            [pack.id]: {...draft, price: e.target.value},
                          }))
                        }
                      />
                    ) : (
                      <span className="text-foreground">{formatAed(pack.price)}</span>
                    )}
                  </CreditPackageTableCell>
                </td>
                <td className="px-4 py-2">
                  <CreditPackageTableCell>
                    {isEditing ? (
                      <select
                        className={tableSelectClass}
                        value={draft.badge}
                        onChange={e =>
                          setCreditPackageDrafts(state => ({
                            ...state,
                            [pack.id]: {
                              ...draft,
                              badge: e.target.value as CreditPackageBadge | '',
                            },
                          }))
                        }>
                        <option value="">None</option>
                        <option value="popular">Popular</option>
                        <option value="value">Best value</option>
                      </select>
                    ) : pack.badge ? (
                      <Badge tone={pack.badge === 'popular' ? 'coral' : 'sky'}>{pack.badge}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </CreditPackageTableCell>
                </td>
                <td className="px-4 py-2">
                  <CreditPackageTableCell>
                    <span className="text-muted-foreground">{inclVat}</span>
                  </CreditPackageTableCell>
                </td>
                <td className="px-4 py-2">
                  <CreditPackageTableCell>
                    {pack.active ? (
                      <Badge tone="primary">Active</Badge>
                    ) : (
                      <Badge tone="muted">Archived</Badge>
                    )}
                  </CreditPackageTableCell>
                </td>
                {canWrite ? (
                  <td className="px-4 py-2">
                    <CatalogActions
                      isEditing={isEditing}
                      saving={savingCreditPackage === pack.id}
                      onCancel={() => cancelEditCreditPackage(pack)}
                      onSave={() => void saveCreditPackage(pack.id)}
                      onEdit={() => startEditCreditPackage(pack)}
                      toggleLabel={pack.active ? 'Archive' : 'Restore'}
                      onToggle={() => void toggleCreditPackage(pack.id, !pack.active)}
                    />
                  </td>
                ) : null}
              </tr>
            );
          })}
          {packages.isLoading && packages.items.length > 0 ? (
            <tr>
              <td colSpan={canWrite ? 7 : 6} className="py-3 text-center">
                <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
              </td>
            </tr>
          ) : null}
          {canWrite ? (
            <tr className="border-t-2 border-border bg-primary-soft/40">
              <td className="px-4 py-2">
                <CreditPackageTableCell>
                  <input
                    className={tableInputClass}
                    value={creditPackageForm.name}
                    onChange={e => setCreditPackageForm(form => ({...form, name: e.target.value}))}
                    placeholder="Starter"
                  />
                </CreditPackageTableCell>
              </td>
              <td className="px-4 py-2">
                <CreditPackageTableCell>
                  <input
                    className={tableInputClass}
                    type="number"
                    min={1}
                    value={creditPackageForm.credits}
                    onChange={e => setCreditPackageForm(form => ({...form, credits: e.target.value}))}
                    placeholder="10"
                  />
                </CreditPackageTableCell>
              </td>
              <td className="px-4 py-2">
                <CreditPackageTableCell>
                  <input
                    className={tableInputClass}
                    type="number"
                    min={1}
                    value={creditPackageForm.price}
                    onChange={e => setCreditPackageForm(form => ({...form, price: e.target.value}))}
                    placeholder="199"
                  />
                </CreditPackageTableCell>
              </td>
              <td className="px-4 py-2">
                <CreditPackageTableCell>
                  <select
                    className={tableSelectClass}
                    value={creditPackageForm.badge}
                    onChange={e =>
                      setCreditPackageForm(form => ({
                        ...form,
                        badge: e.target.value as CreditPackageBadge | '',
                      }))
                    }>
                    <option value="">None</option>
                    <option value="popular">Popular</option>
                    <option value="value">Best value</option>
                  </select>
                </CreditPackageTableCell>
              </td>
              <td className="px-4 py-2">
                <CreditPackageTableCell>
                  <span className="text-muted-foreground">
                    {Number.isFinite(Number(creditPackageForm.price)) && creditPackageForm.price && overview
                      ? formatAed(Number(creditPackageForm.price) * (1 + overview.vatRate))
                      : '—'}
                  </span>
                </CreditPackageTableCell>
              </td>
              <td className="px-4 py-2">
                <CreditPackageTableCell>
                  <Badge tone="sky">New</Badge>
                </CreditPackageTableCell>
              </td>
              <td className="px-4 py-2">
                <CreditPackageTableCell className="justify-end gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(creditPackageActionButtonClass, 'invisible pointer-events-none')}
                    tabIndex={-1}
                    aria-hidden>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className={creditPackageActionButtonClass}
                    disabled={
                      creatingCreditPackage ||
                      !creditPackageForm.name.trim() ||
                      !(Number(creditPackageForm.credits) >= 1) ||
                      !(Number(creditPackageForm.price) > 0)
                    }
                    onClick={() => void submitCreateCreditPackage()}>
                    {creatingCreditPackage ? (
                      <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : 'Add'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(creditPackageArchiveButtonClass, 'invisible pointer-events-none')}
                    tabIndex={-1}
                    aria-hidden>
                    Archive
                  </Button>
                </CreditPackageTableCell>
              </td>
            </tr>
          ) : null}
        </DataTable>
        {creditPackageError ? <p className="mt-2 text-sm text-destructive">{creditPackageError}</p> : null}
      </div>

      {overview ? (<>
      <h2 className="mb-3 text-lg font-semibold text-foreground">Promo codes</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Discount codes applied at pro checkout. Add, edit, or deactivate promos — discount is a
        percentage off the credit package subtotal.
      </p>
      <div className="mb-8">
        <DataTable
          tableClassName="table-fixed"
          columnWidths={canWrite ? ['28%', '18%', '18%', '36%'] : ['40%', '30%', '30%']}
          columns={
            canWrite ? ['Code', 'Discount %', 'Status', 'Actions'] : ['Code', 'Discount %', 'Status']
          }>
          {overview.promos.map(promo => {
            const draft = promoDrafts[promo.id] ?? {
              code: promo.code,
              discountRate: String(Math.round(promo.discountRate * 100)),
            };
            const isEditing = canWrite && editingPromoId === promo.id;

            return (
              <tr
                key={promo.id}
                className={cn(
                  'border-b border-border last:border-0',
                  !promo.active && 'bg-muted/30',
                  isEditing && 'bg-primary-soft/30',
                )}>
                <td className="px-4 py-2">
                  <CreditPackageTableCell>
                    {isEditing ? (
                      <input
                        className={cn(tableInputClass, 'font-mono uppercase')}
                        value={draft.code}
                        onChange={e =>
                          setPromoDrafts(state => ({
                            ...state,
                            [promo.id]: {...draft, code: e.target.value.toUpperCase()},
                          }))
                        }
                      />
                    ) : (
                      <span className="font-mono font-medium text-foreground">{promo.code}</span>
                    )}
                  </CreditPackageTableCell>
                </td>
                <td className="px-4 py-2">
                  <CreditPackageTableCell>
                    {isEditing ? (
                      <input
                        className={cn(tableInputClass, 'max-w-[6rem]')}
                        type="number"
                        min={1}
                        max={50}
                        value={draft.discountRate}
                        onChange={e =>
                          setPromoDrafts(state => ({
                            ...state,
                            [promo.id]: {...draft, discountRate: e.target.value},
                          }))
                        }
                      />
                    ) : (
                      <span className="text-foreground">{formatDiscount(promo.discountRate)}</span>
                    )}
                  </CreditPackageTableCell>
                </td>
                <td className="px-4 py-2">
                  <CreditPackageTableCell>
                    {promo.active ? (
                      <Badge tone="primary">Active</Badge>
                    ) : (
                      <Badge tone="muted">Inactive</Badge>
                    )}
                  </CreditPackageTableCell>
                </td>
                {canWrite ? (
                  <td className="px-4 py-2">
                    <CatalogActions
                      isEditing={isEditing}
                      saving={savingPromo === promo.id}
                      onCancel={() => cancelEditPromo(promo)}
                      onSave={() => void savePromo(promo.id)}
                      onEdit={() => startEditPromo(promo)}
                      toggleLabel={promo.active ? 'Deactivate' : 'Activate'}
                      onToggle={() => void togglePromo(promo.id, !promo.active)}
                    />
                  </td>
                ) : null}
              </tr>
            );
          })}
          {canWrite ? (
            <tr className="border-t-2 border-border bg-primary-soft/40">
              <td className="px-4 py-2">
                <CreditPackageTableCell>
                  <input
                    className={cn(tableInputClass, 'font-mono uppercase')}
                    value={promoForm.code}
                    onChange={e =>
                      setPromoForm(form => ({...form, code: e.target.value.toUpperCase()}))
                    }
                    placeholder="HALA10"
                  />
                </CreditPackageTableCell>
              </td>
              <td className="px-4 py-2">
                <CreditPackageTableCell>
                  <input
                    className={cn(tableInputClass, 'max-w-[6rem]')}
                    type="number"
                    min={1}
                    max={50}
                    value={promoForm.discountRate}
                    onChange={e =>
                      setPromoForm(form => ({...form, discountRate: e.target.value}))
                    }
                    placeholder="10"
                  />
                </CreditPackageTableCell>
              </td>
              <td className="px-4 py-2">
                <CreditPackageTableCell>
                  <Badge tone="sky">New</Badge>
                </CreditPackageTableCell>
              </td>
              <td className="px-4 py-2">
                <CreditPackageTableCell className="justify-end gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(creditPackageActionButtonClass, 'invisible pointer-events-none')}
                    tabIndex={-1}
                    aria-hidden>
                    Cancel
                  </Button>
                  <Button size="sm" className={creditPackageActionButtonClass} onClick={() => void submitCreatePromo()}>
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(creditPackageArchiveButtonClass, 'invisible pointer-events-none')}
                    tabIndex={-1}
                    aria-hidden>
                    Deactivate
                  </Button>
                </CreditPackageTableCell>
              </td>
            </tr>
          ) : null}
        </DataTable>
        {promoError ? <p className="mt-2 text-sm text-destructive">{promoError}</p> : null}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold text-foreground">Transactions</h2>
      <FilterBar>
        {(
          [
            ['all', 'All'],
            ['purchase', 'Purchases'],
            ['spend', 'Unlocks'],
            ['adjustment', 'Adjustments'],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={txnFilter === key ? 'primary' : 'outline'}
            onClick={() => setTxnFilter(key)}>
            {label}
          </Button>
        ))}
      </FilterBar>
      {transactions.length === 0 ? (
        <EmptyState title="No transactions" body="Try another filter." />
      ) : (
        <DataTable columns={['When', 'Coach', 'Type', 'Credits', 'Details', 'Paid']}>
          {transactions.map(txn => (
            <tr key={txn.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {new Date(txn.at).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-sm">{txn.professionalName}</td>
              <td className="px-4 py-3">
                <Badge tone={txn.type === 'purchase' ? 'primary' : txn.type === 'spend' ? 'coral' : 'sky'}>
                  {txn.type}
                </Badge>
              </td>
              <td className="px-4 py-3 font-medium">
                {txn.type === 'spend' ? '−' : '+'}
                {txn.credits}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {txn.label}
                {txn.orderId ? ` · ${txn.orderId}` : ''}
              </td>
              <td className="px-4 py-3 text-sm">
                {txn.totalAed ? formatAed(txn.totalAed) : '—'}
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      {canAdjust ? (
        <>
          <h2 className="mb-3 mt-8 text-lg font-semibold text-foreground">Wallet adjustment</h2>
          <Card>
            <form onSubmit={onAdjust} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block text-sm">
                <span className="font-medium">Coach</span>
                <select
                  className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  value={adjustForm.professionalId}
                  onChange={e =>
                    setAdjustForm(form => ({...form, professionalId: e.target.value}))
                  }>
                  {professionals.map(pro => (
                    <option key={pro.id} value={pro.id}>
                      {pro.name} ({pro.credits} cr)
                    </option>
                  ))}
                </select>
              </label>
              <Input
                label="Credits (+/−)"
                type="number"
                value={adjustForm.credits}
                onChange={e => setAdjustForm(form => ({...form, credits: e.target.value}))}
                placeholder="e.g. 5 or -2"
                required
              />
              <Input
                label="Note"
                value={adjustForm.label}
                onChange={e => setAdjustForm(form => ({...form, label: e.target.value}))}
                placeholder="Support credit"
              />
              <div className="flex items-end">
                <Button type="submit" disabled={adjusting}>
                  {adjusting ? 'Applying…' : 'Apply adjustment'}
                </Button>
              </div>
            </form>
            {adjustError ? <p className="mt-2 text-sm text-destructive">{adjustError}</p> : null}
            <p className="mt-3 text-xs text-muted-foreground">
              Support can add or remove credits. Changes appear in the coach wallet and transaction
              list above.
            </p>
          </Card>
        </>
      ) : null}

      </>) : null}

      <ConfirmDialog
        open={pendingAdjust}
        title="Apply wallet adjustment?"
        body={`${professionals.find(pro => pro.id === adjustForm.professionalId)?.name ?? 'This coach'} will ${Number(adjustForm.credits) > 0 ? 'receive' : 'lose'} ${Math.abs(Number(adjustForm.credits) || 0)} credits. This cannot be undone from the admin UI.`}
        confirmLabel="Apply adjustment"
        destructive={Number(adjustForm.credits) < 0}
        onClose={() => setPendingAdjust(false)}
        onConfirm={() => void runAdjust()}
      />
    </>
  );
}
