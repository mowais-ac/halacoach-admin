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
import {createCreditPackage, updateCreditPackage} from '@/lib/apis';
import type {CreditPackageBadge} from '@/api/types';
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

type PackDraft = {
  name: string;
  credits: string;
  price: string;
  badge: CreditPackageBadge | '';
};

type PromoDraft = {
  code: string;
  discountRate: string;
};

const emptyPackForm: PackDraft = {name: '', credits: '', price: '', badge: ''};
const emptyPromoForm: PromoDraft = {code: '', discountRate: '10'};

const tableInputClass =
  'h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-primary';
const tableSelectClass =
  'h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-primary';
const packTableCellClass = 'flex h-9 items-center';
const packActionButtonClass = 'w-[4.75rem] shrink-0 justify-center';
const packArchiveButtonClass = 'min-w-[5.5rem] shrink-0 justify-center';

function PackTableCell({children, className}: {children: React.ReactNode; className?: string}) {
  return <div className={cn(packTableCellClass, className)}>{children}</div>;
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
    <PackTableCell className="justify-end gap-1">
      {isEditing ? (
        <Button size="sm" variant="outline" className={packActionButtonClass} onClick={onCancel}>
          Cancel
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className={cn(packActionButtonClass, 'invisible pointer-events-none')}
          tabIndex={-1}
          aria-hidden>
          Cancel
        </Button>
      )}
      {isEditing ? (
        <Button size="sm" className={packActionButtonClass} disabled={saving} onClick={onSave}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      ) : (
        <Button size="sm" variant="outline" className={packActionButtonClass} onClick={onEdit}>
          Edit
        </Button>
      )}
      <Button size="sm" variant="outline" className={packArchiveButtonClass} onClick={onToggle}>
        {toggleLabel}
      </Button>
    </PackTableCell>
  );
}

export function CreditsScreen({actor}: {actor: SessionUser}) {
  const canWrite = can(actor.role, 'credits:write');
  const canAdjust = can(actor.role, 'credits:adjust');
  const [overview, setOverview] = useState<CreditsOverview | null>(null);
  const [professionals, setProfessionals] = useState<ProfessionalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [packDrafts, setPackDrafts] = useState<Record<string, PackDraft>>({});
  const [packForm, setPackForm] = useState<PackDraft>(emptyPackForm);
  const [packError, setPackError] = useState<string | null>(null);
  const [savingPack, setSavingPack] = useState<string | null>(null);
  const [editingPackId, setEditingPackId] = useState<string | null>(null);
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

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [credits, pros] = await Promise.all([getCreditsOverview(), listProfessionals()]);
      setOverview(credits);
      setProfessionals(pros);
      setPackDrafts(
        Object.fromEntries(
          credits.packs.map(pack => [
            pack.id,
            {
              name: pack.name,
              credits: String(pack.credits),
              price: String(pack.price),
              badge: pack.badge ?? '',
            },
          ]),
        ),
      );
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

  const savePack = async (packId: string) => {
    const draft = packDrafts[packId];
    const credits = Number(draft?.credits);
    const price = Number(draft?.price);
    const name = draft?.name.trim() ?? '';
    if (!name) {
      setError('Pack name cannot be empty.');
      return;
    }
    if (!Number.isFinite(credits) || credits < 1) {
      setError('Each pack needs at least 1 credit.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError('Enter a valid pack price in AED.');
      return;
    }
    setSavingPack(packId);
    setError(null);
    try {
      await updateCreditPackage(packId, {
        name,
        credits,
        price,
        badge: draft.badge || null,
      });
      setEditingPackId(current => (current === packId ? null : current));
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Could not update pack.');
    } finally {
      setSavingPack(null);
    }
  };

  const submitCreatePack = async () => {
    setPackError(null);
    const credits = Number(packForm.credits);
    const price = Number(packForm.price);
    if (!packForm.name.trim()) {
      setPackError('Name is required.');
      return;
    }
    if (!Number.isFinite(credits) || credits < 1) {
      setPackError('Credits must be at least 1.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setPackError('Price must be greater than zero.');
      return;
    }
    try {
      await createCreditPackage({
        name: packForm.name.trim(),
        credits,
        price,
        badge: packForm.badge || null,
      });
      setPackForm(emptyPackForm);
      await load();
    } catch (err) {
      setPackError(isApiError(err) ? err.message : 'Could not create pack.');
    }
  };

  const startEditPack = (pack: CreditsOverview['packs'][number]) => {
    if (editingPackId && editingPackId !== pack.id) {
      const previous = overview?.packs.find(item => item.id === editingPackId);
      if (previous) {
        setPackDrafts(state => ({
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
    setEditingPackId(pack.id);
    setPackDrafts(state => ({
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

  const cancelEditPack = (pack: CreditsOverview['packs'][number]) => {
    setPackDrafts(state => ({
      ...state,
      [pack.id]: {
        name: pack.name,
        credits: String(pack.credits),
        price: String(pack.price),
        badge: pack.badge ?? '',
      },
    }));
    setEditingPackId(current => (current === pack.id ? null : current));
  };

  const togglePack = async (packId: string, active: boolean) => {
    try {
      await updateCreditPackage(packId, {active});
      setEditingPackId(current => (current === packId ? null : current));
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Could not update pack.');
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

  if (loading) {
    return <LoadingState label="Loading credits…" />;
  }

  if (error && !overview) {
    return <ErrorState body={error} onRetry={() => void load()} />;
  }

  if (!overview) {
    return null;
  }

  return (
    <>
      <PageHeader
        module="M9"
        title="Credits"
        description={`Packs, promo codes, VAT at ${Math.round(overview.vatRate * 100)}%, transactions, and wallet adjustments.`}
      />

      {error ? (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-destructive">{error}</p>
      ) : null}

      {!canWrite && !canAdjust ? (
        <p className="mb-4 rounded-xl bg-primary-soft px-4 py-3 text-sm text-primary-deep">
          View only — pack prices and promos require super admin; adjustments require support or
          super.
        </p>
      ) : null}

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

      <h2 className="mb-3 text-lg font-semibold text-foreground">Credit packages</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Catalog shown in the pro checkout. Add, edit, or archive packs — prices exclude VAT;{' '}
        {Math.round(overview.vatRate * 100)}% is added at checkout.
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
          {overview.packs.map(pack => {
            const draft = packDrafts[pack.id] ?? {
              name: pack.name,
              credits: String(pack.credits),
              price: String(pack.price),
              badge: pack.badge ?? '',
            };
            const isEditing = canWrite && editingPackId === pack.id;
            const displayPrice = isEditing ? Number(draft.price) : pack.price;
            const inclVat = Number.isFinite(displayPrice)
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
                  <PackTableCell>
                    {isEditing ? (
                      <input
                        className={tableInputClass}
                        value={draft.name}
                        onChange={e =>
                          setPackDrafts(state => ({
                            ...state,
                            [pack.id]: {...draft, name: e.target.value},
                          }))
                        }
                      />
                    ) : (
                      <span className="truncate font-medium text-foreground">{pack.name}</span>
                    )}
                  </PackTableCell>
                </td>
                <td className="px-4 py-2">
                  <PackTableCell>
                    {isEditing ? (
                      <input
                        className={tableInputClass}
                        type="number"
                        min={1}
                        value={draft.credits}
                        onChange={e =>
                          setPackDrafts(state => ({
                            ...state,
                            [pack.id]: {...draft, credits: e.target.value},
                          }))
                        }
                      />
                    ) : (
                      <span className="text-foreground">{pack.credits}</span>
                    )}
                  </PackTableCell>
                </td>
                <td className="px-4 py-2">
                  <PackTableCell>
                    {isEditing ? (
                      <input
                        className={tableInputClass}
                        type="number"
                        min={1}
                        value={draft.price}
                        onChange={e =>
                          setPackDrafts(state => ({
                            ...state,
                            [pack.id]: {...draft, price: e.target.value},
                          }))
                        }
                      />
                    ) : (
                      <span className="text-foreground">{formatAed(pack.price)}</span>
                    )}
                  </PackTableCell>
                </td>
                <td className="px-4 py-2">
                  <PackTableCell>
                    {isEditing ? (
                      <select
                        className={tableSelectClass}
                        value={draft.badge}
                        onChange={e =>
                          setPackDrafts(state => ({
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
                  </PackTableCell>
                </td>
                <td className="px-4 py-2">
                  <PackTableCell>
                    <span className="text-muted-foreground">{inclVat}</span>
                  </PackTableCell>
                </td>
                <td className="px-4 py-2">
                  <PackTableCell>
                    {pack.active ? (
                      <Badge tone="primary">Active</Badge>
                    ) : (
                      <Badge tone="muted">Archived</Badge>
                    )}
                  </PackTableCell>
                </td>
                {canWrite ? (
                  <td className="px-4 py-2">
                    <CatalogActions
                      isEditing={isEditing}
                      saving={savingPack === pack.id}
                      onCancel={() => cancelEditPack(pack)}
                      onSave={() => void savePack(pack.id)}
                      onEdit={() => startEditPack(pack)}
                      toggleLabel={pack.active ? 'Archive' : 'Restore'}
                      onToggle={() => void togglePack(pack.id, !pack.active)}
                    />
                  </td>
                ) : null}
              </tr>
            );
          })}
          {canWrite ? (
            <tr className="border-t-2 border-border bg-primary-soft/40">
              <td className="px-4 py-2">
                <PackTableCell>
                  <input
                    className={tableInputClass}
                    value={packForm.name}
                    onChange={e => setPackForm(form => ({...form, name: e.target.value}))}
                    placeholder="Starter"
                  />
                </PackTableCell>
              </td>
              <td className="px-4 py-2">
                <PackTableCell>
                  <input
                    className={tableInputClass}
                    type="number"
                    min={1}
                    value={packForm.credits}
                    onChange={e => setPackForm(form => ({...form, credits: e.target.value}))}
                    placeholder="10"
                  />
                </PackTableCell>
              </td>
              <td className="px-4 py-2">
                <PackTableCell>
                  <input
                    className={tableInputClass}
                    type="number"
                    min={1}
                    value={packForm.price}
                    onChange={e => setPackForm(form => ({...form, price: e.target.value}))}
                    placeholder="199"
                  />
                </PackTableCell>
              </td>
              <td className="px-4 py-2">
                <PackTableCell>
                  <select
                    className={tableSelectClass}
                    value={packForm.badge}
                    onChange={e =>
                      setPackForm(form => ({
                        ...form,
                        badge: e.target.value as CreditPackageBadge | '',
                      }))
                    }>
                    <option value="">None</option>
                    <option value="popular">Popular</option>
                    <option value="value">Best value</option>
                  </select>
                </PackTableCell>
              </td>
              <td className="px-4 py-2">
                <PackTableCell>
                  <span className="text-muted-foreground">
                    {Number.isFinite(Number(packForm.price)) && packForm.price
                      ? formatAed(Number(packForm.price) * (1 + overview.vatRate))
                      : '—'}
                  </span>
                </PackTableCell>
              </td>
              <td className="px-4 py-2">
                <PackTableCell>
                  <Badge tone="sky">New</Badge>
                </PackTableCell>
              </td>
              <td className="px-4 py-2">
                <PackTableCell className="justify-end gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(packActionButtonClass, 'invisible pointer-events-none')}
                    tabIndex={-1}
                    aria-hidden>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className={packActionButtonClass}
                    onClick={() => void submitCreatePack()}>
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(packArchiveButtonClass, 'invisible pointer-events-none')}
                    tabIndex={-1}
                    aria-hidden>
                    Archive
                  </Button>
                </PackTableCell>
              </td>
            </tr>
          ) : null}
        </DataTable>
        {packError ? <p className="mt-2 text-sm text-destructive">{packError}</p> : null}
      </div>

      <h2 className="mb-3 text-lg font-semibold text-foreground">Promo codes</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Discount codes applied at pro checkout. Add, edit, or deactivate promos — discount is a
        percentage off the pack subtotal.
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
                  <PackTableCell>
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
                  </PackTableCell>
                </td>
                <td className="px-4 py-2">
                  <PackTableCell>
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
                  </PackTableCell>
                </td>
                <td className="px-4 py-2">
                  <PackTableCell>
                    {promo.active ? (
                      <Badge tone="primary">Active</Badge>
                    ) : (
                      <Badge tone="muted">Inactive</Badge>
                    )}
                  </PackTableCell>
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
                <PackTableCell>
                  <input
                    className={cn(tableInputClass, 'font-mono uppercase')}
                    value={promoForm.code}
                    onChange={e =>
                      setPromoForm(form => ({...form, code: e.target.value.toUpperCase()}))
                    }
                    placeholder="HALA10"
                  />
                </PackTableCell>
              </td>
              <td className="px-4 py-2">
                <PackTableCell>
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
                </PackTableCell>
              </td>
              <td className="px-4 py-2">
                <PackTableCell>
                  <Badge tone="sky">New</Badge>
                </PackTableCell>
              </td>
              <td className="px-4 py-2">
                <PackTableCell className="justify-end gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(packActionButtonClass, 'invisible pointer-events-none')}
                    tabIndex={-1}
                    aria-hidden>
                    Cancel
                  </Button>
                  <Button size="sm" className={packActionButtonClass} onClick={() => void submitCreatePromo()}>
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(packArchiveButtonClass, 'invisible pointer-events-none')}
                    tabIndex={-1}
                    aria-hidden>
                    Deactivate
                  </Button>
                </PackTableCell>
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
