'use client'

import { cn } from '@/lib/utils'
import type { User } from '@/types/user'

type UserStatusState = 'active' | 'inactive' | 'email_unverified'

const STATUS_CONFIG: Record<
  UserStatusState,
  { label: string; dotBg: string; textColor: string; badgeBg: string }
> = {
  active: {
    label: 'Active',
    dotBg: 'bg-[#16A34A]',
    textColor: 'text-[#16A34A] dark:text-[#4ADE80]',
    badgeBg: 'bg-[#DCFCE7] dark:bg-[rgba(22,163,74,0.15)]',
  },
  inactive: {
    label: 'Inactive',
    dotBg: 'bg-[#6B7280]',
    textColor: 'text-[#6B7280] dark:text-[#9CA3AF]',
    badgeBg: 'bg-[#F3F4F6] dark:bg-[rgba(107,114,128,0.15)]',
  },
  email_unverified: {
    label: 'Email Unverified',
    dotBg: 'bg-[#D97706]',
    textColor: 'text-[#D97706] dark:text-[#FCD34D]',
    badgeBg: 'bg-[#FEF3C7] dark:bg-[rgba(217,119,6,0.15)]',
  },
}

function getUserStatusState(user: Pick<User, 'isActive' | 'isEmailVerified'>): UserStatusState {
  if (!user.isActive) return 'inactive'
  if (!user.isEmailVerified) return 'email_unverified'
  return 'active'
}

interface UserStatusBadgeProps {
  user: Pick<User, 'isActive' | 'isEmailVerified'>
  className?: string
}

export function UserStatusBadge({ user, className }: UserStatusBadgeProps) {
  const state = getUserStatusState(user)
  const config = STATUS_CONFIG[state]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[14px] font-normal',
        config.badgeBg,
        config.textColor,
        className
      )}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', config.dotBg)} />
      </span>
      <span>{config.label}</span>
    </span>
  )
}
