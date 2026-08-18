import type {NotificationPrefs} from '@/api/types';
import {Badge} from '@/components/ui/Badge';
import {notificationPrefLabels} from '@/lib/notification-utils';

export function NotificationPrefsPanel({prefs}: {prefs: NotificationPrefs}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {notificationPrefLabels.map(item => (
        <div
          key={item.key}
          className="flex items-start justify-between gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">{item.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{item.hint}</p>
          </div>
          <Badge tone={prefs[item.key] ? 'primary' : 'muted'}>
            {prefs[item.key] ? 'On' : 'Off'}
          </Badge>
        </div>
      ))}
    </div>
  );
}
