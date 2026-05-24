'use client'

import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Switch from '@radix-ui/react-switch'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/useNotifications'
import type { NotificationPreferenceDto, NotificationType, NotificationChannel } from '@/types/notification'

interface NotificationPreferencesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EVENT_TYPES: { type: NotificationType; label: string; criticalEmail?: boolean }[] = [
  { type: 'CLASSIFICATION_COMPLETED', label: 'Classification Completed' },
  { type: 'CLASSIFICATION_FAILED', label: 'Classification Failed', criticalEmail: true },
  { type: 'CLASSIFICATION_NEEDS_REVIEW', label: 'Classification Needs Review' },
  { type: 'PIPELINE_FAILURE', label: 'Pipeline Failure', criticalEmail: true },
  { type: 'OVERRIDE_SUBMITTED', label: 'Override Submitted' },
]

const CHANNELS: NotificationChannel[] = ['IN_APP', 'EMAIL']

function buildDefaultPreferences(): NotificationPreferenceDto[] {
  const prefs: NotificationPreferenceDto[] = []
  for (const { type, criticalEmail } of EVENT_TYPES) {
    prefs.push({ eventType: type, channel: 'IN_APP', enabled: true })
    prefs.push({ eventType: type, channel: 'EMAIL', enabled: !!criticalEmail })
  }
  return prefs
}

export function NotificationPreferencesModal({
  open,
  onOpenChange,
}: NotificationPreferencesModalProps) {
  const { data: serverPreferences, isLoading } = useNotificationPreferences()
  const { mutate: updatePreferences, isPending } = useUpdateNotificationPreferences()

  const [localPrefs, setLocalPrefs] = useState<NotificationPreferenceDto[]>(
    buildDefaultPreferences
  )

  // Sync local prefs from server when modal opens
  useEffect(() => {
    if (serverPreferences && serverPreferences.length > 0) {
      setLocalPrefs(serverPreferences)
    }
  }, [serverPreferences])

  function getEnabled(type: NotificationType, channel: NotificationChannel): boolean {
    const pref = localPrefs.find((p) => p.eventType === type && p.channel === channel)
    return pref?.enabled ?? true
  }

  function setEnabled(type: NotificationType, channel: NotificationChannel, enabled: boolean) {
    setLocalPrefs((prev) => {
      const existing = prev.find((p) => p.eventType === type && p.channel === channel)
      if (existing) {
        return prev.map((p) =>
          p.eventType === type && p.channel === channel ? { ...p, enabled } : p
        )
      }
      return [...prev, { eventType: type, channel, enabled }]
    })
  }

  function handleSave() {
    updatePreferences(localPrefs, {
      onSuccess: () => onOpenChange(false),
    })
  }

  function handleDiscard() {
    // Reset to server values before closing
    if (serverPreferences && serverPreferences.length > 0) {
      setLocalPrefs(serverPreferences)
    }
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 dark:bg-black/50" />

        {/* Content */}
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'w-[560px] max-w-[calc(100vw-32px)]',
            'bg-[var(--color-background)] rounded-xl',
            'shadow-[0_8px_40px_rgba(0,0,0,0.18),_0_4px_16px_rgba(0,0,0,0.12)]',
            'focus-visible:outline-none'
          )}
          aria-describedby="prefs-subtitle"
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-6 pb-4">
            <div>
              <Dialog.Title className="text-[24px] font-[600] leading-[1.2]">
                Notification Preferences
              </Dialog.Title>
              <p
                id="prefs-subtitle"
                className="text-[14px] font-[400] text-muted-foreground mt-1"
              >
                Configure when and how you receive notifications.
              </p>
            </div>
            <Dialog.Close asChild>
              <button
                className={cn(
                  'w-8 h-8 flex items-center justify-center rounded-md',
                  'text-muted-foreground hover:text-foreground',
                  'hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-blue-600'
                )}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {/* Table */}
          <div className="px-6 pb-2">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground text-[14px]">
                Loading preferences…
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-[14px] font-[400] text-muted-foreground pb-2">
                      Event Type
                    </th>
                    <th className="text-center text-[14px] font-[400] text-muted-foreground pb-2 w-24">
                      In-App
                    </th>
                    <th className="text-center text-[14px] font-[400] text-muted-foreground pb-2 w-24">
                      Email
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {EVENT_TYPES.map(({ type, label }) => (
                    <tr key={type} className="border-t border-black/[0.06] dark:border-white/[0.04]">
                      <td className="py-3 text-[14px] font-[400] pr-4">{label}</td>
                      {CHANNELS.map((channel) => (
                        <td key={channel} className="py-3 text-center">
                          <Switch.Root
                            checked={getEnabled(type, channel)}
                            onCheckedChange={(checked) => setEnabled(type, channel, checked)}
                            className={cn(
                              'relative inline-flex h-6 w-11 items-center rounded-full',
                              'focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
                              'transition-colors duration-150 ease-in-out cursor-pointer',
                              getEnabled(type, channel)
                                ? 'bg-[#1D4ED8] dark:bg-[#3B82F6]'
                                : 'bg-[#D1D5DB] dark:bg-[#374151]'
                            )}
                            aria-label={`${label} ${channel === 'IN_APP' ? 'in-app' : 'email'} notifications`}
                          >
                            <Switch.Thumb
                              className={cn(
                                'block h-4 w-4 rounded-full bg-white shadow',
                                'transition-transform duration-150 ease-in-out',
                                'translate-x-1 data-[state=checked]:translate-x-6'
                              )}
                            />
                          </Switch.Root>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer note */}
          <div className="px-6 pb-4">
            <p className="text-[14px] font-[400] text-muted-foreground italic">
              Emails sent only when SMTP is configured
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-black/[0.06] dark:border-white/[0.04]">
            <button
              type="button"
              autoFocus
              onClick={handleDiscard}
              className={cn(
                'px-4 py-2 rounded-lg text-[14px] font-[500]',
                'border border-gray-300 dark:border-gray-600',
                'bg-transparent text-foreground',
                'hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
                'focus-visible:ring-2 focus-visible:ring-blue-600'
              )}
            >
              Keep Current Settings
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className={cn(
                'px-4 py-2 rounded-lg text-[14px] font-[500]',
                'bg-gradient-to-br from-[#1D4ED8] to-[#7C3AED] text-white',
                'hover:opacity-90 transition-opacity',
                'focus-visible:ring-2 focus-visible:ring-blue-600',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isPending ? 'Saving…' : 'Save Preferences'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
