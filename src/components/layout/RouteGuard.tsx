'use client';

import type {ReactNode} from 'react';
import {usePathname} from 'next/navigation';
import type {AdminRole} from '@/api/types';
import {can, permissionForPath} from '@/lib/permissions';
import {Forbidden} from './Forbidden';

export function RouteGuard({
  role,
  children,
}: {
  role: AdminRole;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const permission = permissionForPath(pathname);
  if (!can(role, permission)) {
    return (
      <Forbidden
        body="Your role cannot open this page. Super admins have full access; reviewers handle verification; support handles clients, credits, and the support inbox."
      />
    );
  }
  return children;
}
