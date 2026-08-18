'use client';

import {FormEvent, useEffect, useMemo, useState} from 'react';
import {ChevronDown, ChevronUp} from 'lucide-react';
import {
  createService,
  isApiError,
  listServices,
  reorderServices,
  updateService,
  type CatalogService,
  type SessionUser,
} from '@/api';
import {Badge} from '@/components/ui/Badge';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {ConfirmDialog} from '@/components/ui/ConfirmDialog';
import {DataTable} from '@/components/ui/DataTable';
import {EmptyState} from '@/components/ui/EmptyState';
import {ErrorState} from '@/components/ui/ErrorState';
import {FilterBar} from '@/components/ui/DataTable';
import {Input} from '@/components/ui/Input';
import {LoadingState} from '@/components/ui/LoadingState';
import {PageHeader} from '@/components/ui/PageHeader';
import {can} from '@/lib/permissions';

type Filter = 'all' | 'active' | 'archived';

const emptyForm = {nameEn: '', nameAr: '', slug: ''};

export function ServicesScreen({actor}: {actor: SessionUser}) {
  const canWrite = can(actor.role, 'services:write');
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingArchive, setPendingArchive] = useState<CatalogService | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setServices(await listServices());
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Could not load services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter(item => {
      if (filter === 'active' && !item.active) {
        return false;
      }
      if (filter === 'archived' && item.active) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        item.nameEn.toLowerCase().includes(q) ||
        item.nameAr.includes(q) ||
        item.slug.includes(q)
      );
    });
  }, [services, filter, query]);

  const counts = useMemo(
    () => ({
      total: services.length,
      active: services.filter(item => item.active).length,
    }),
    [services],
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError(null);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    try {
      if (editingId) {
        await updateService(editingId, form);
      } else {
        await createService(form);
      }
      resetForm();
      await load();
    } catch (err) {
      setFormError(isApiError(err) ? err.message : 'Could not save service.');
    }
  };

  const move = async (id: string, direction: -1 | 1) => {
    const ids = services.map(item => item.id);
    const index = ids.indexOf(id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= ids.length) {
      return;
    }
    const swapped = [...ids];
    const current = swapped[index]!;
    swapped[index] = swapped[next]!;
    swapped[next] = current;
    setError(null);
    try {
      setServices(await reorderServices(swapped));
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Could not reorder services.');
    }
  };

  const confirmArchive = async () => {
    if (!pendingArchive) {
      return;
    }
    setError(null);
    try {
      await updateService(pendingArchive.id, {active: !pendingArchive.active});
      setPendingArchive(null);
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Could not update service.');
      setPendingArchive(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Services"
        module="M3"
        description="Catalog for professional onboarding. Archived services stay in the database so existing coach profiles still resolve."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone="primary">{counts.active} active</Badge>
        <Badge>{counts.total} in catalog</Badge>
      </div>

      {canWrite ? (
        <Card className="mb-6">
          <p className="mb-4 font-semibold text-foreground">
            {editingId ? 'Edit service' : 'Add service'}
          </p>
          <form className="grid gap-4 md:grid-cols-3" onSubmit={e => void onSubmit(e)}>
            <Input
              label="Name (English)"
              value={form.nameEn}
              onChange={e => setForm(s => ({...s, nameEn: e.target.value}))}
              required
            />
            <Input
              label="الاسم (العربية)"
              dir="rtl"
              value={form.nameAr}
              onChange={e => setForm(s => ({...s, nameAr: e.target.value}))}
              required
            />
            <Input
              label="Slug"
              placeholder="auto from English name"
              value={form.slug}
              onChange={e => setForm(s => ({...s, slug: e.target.value}))}
            />
            {formError ? (
              <p className="md:col-span-3 text-sm text-destructive">{formError}</p>
            ) : null}
            <div className="md:col-span-3 flex gap-2">
              <Button type="submit">{editingId ? 'Save changes' : 'Add service'}</Button>
              {editingId ? (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </Card>
      ) : null}

      <FilterBar>
        {(['all', 'active', 'archived'] as Filter[]).map(item => (
          <Button
            key={item}
            size="sm"
            variant={filter === item ? 'primary' : 'outline'}
            onClick={() => setFilter(item)}>
            {item === 'all' ? 'All' : item === 'active' ? 'Active' : 'Archived'}
          </Button>
        ))}
        <input
          className="h-9 min-w-[200px] flex-1 rounded-xl border border-border px-3 text-sm"
          placeholder="Search English, Arabic, or slug"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </FilterBar>

      {loading ? <LoadingState label="Loading services…" /> : null}
      {error ? <ErrorState body={error} onRetry={() => void load()} /> : null}
      {!loading && !error && visible.length === 0 ? (
        <EmptyState title="No services" body="Try another filter, or add a service." />
      ) : null}

      {!loading && visible.length > 0 ? (
        <DataTable columns={['Order', 'English', 'Arabic', 'Slug', 'Status', '']}>
          {visible.map(item => (
            <tr key={item.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 text-muted-foreground">{item.sortOrder}</td>
              <td className="px-4 py-3 font-medium text-foreground">{item.nameEn}</td>
              <td className="px-4 py-3 text-foreground" dir="rtl">
                {item.nameAr}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.slug}</td>
              <td className="px-4 py-3">
                <Badge tone={item.active ? 'primary' : 'danger'}>
                  {item.active ? 'Active' : 'Archived'}
                </Badge>
              </td>
              <td className="px-4 py-3">
                {canWrite ? (
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Move up"
                      onClick={() => void move(item.id, -1)}>
                      <ChevronUp size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Move down"
                      onClick={() => void move(item.id, 1)}>
                      <ChevronDown size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(item.id);
                        setForm({nameEn: item.nameEn, nameAr: item.nameAr, slug: item.slug});
                        setFormError(null);
                      }}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={item.active ? 'outline' : 'primary'}
                      onClick={() => setPendingArchive(item)}>
                      {item.active ? 'Archive' : 'Restore'}
                    </Button>
                  </div>
                ) : null}
              </td>
            </tr>
          ))}
        </DataTable>
      ) : null}

      <ConfirmDialog
        open={pendingArchive !== null}
        title={pendingArchive?.active ? 'Archive this service?' : 'Restore this service?'}
        body={
          pendingArchive?.active
            ? `${pendingArchive.nameEn} will be hidden from new coach onboarding. Existing profiles keep the slug.`
            : `${pendingArchive?.nameEn ?? ''} will show again in professional onboarding.`
        }
        confirmLabel={pendingArchive?.active ? 'Archive' : 'Restore'}
        destructive={pendingArchive?.active}
        onClose={() => setPendingArchive(null)}
        onConfirm={() => void confirmArchive()}
      />
    </>
  );
}
