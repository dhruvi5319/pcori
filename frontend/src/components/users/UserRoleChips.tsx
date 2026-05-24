'use client'

import type { UserRole } from '@/types/user'

const ROLE_ABBREVIATIONS: Record<UserRole, string> = {
  REVIEWER: 'Rev',
  MANAGER: 'Mgr',
  TAXONOMY_ADMIN: 'Tax',
  ADMIN: 'Admin',
  VIEWER: 'View',
}

const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  REVIEWER: 'Reviewer',
  MANAGER: 'Manager',
  TAXONOMY_ADMIN: 'Taxonomy Admin',
  ADMIN: 'Admin',
  VIEWER: 'Viewer',
}

interface UserRoleChipsProps {
  roles: UserRole[]
}

export function UserRoleChips({ roles }: UserRoleChipsProps) {
  const visibleRoles = roles.slice(0, 2)
  const hiddenCount = roles.length - 2

  const ariaLabel = `Roles: ${roles.map((r) => ROLE_DISPLAY_NAMES[r]).join(', ')}`

  return (
    <div
      className="flex flex-wrap items-center gap-1"
      aria-label={ariaLabel}
    >
      {visibleRoles.map((role) => (
        <span
          key={role}
          className="inline-flex items-center px-2 py-0.5 rounded
                     bg-[#F4F6F9] dark:bg-[#1E1E1E]
                     border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)]
                     text-[14px] font-normal text-gray-700 dark:text-gray-300"
          style={{ height: '24px' }}
          aria-hidden="true"
        >
          {ROLE_ABBREVIATIONS[role]}
        </span>
      ))}
      {hiddenCount > 0 && (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded
                     bg-[#F4F6F9] dark:bg-[#1E1E1E]
                     border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)]
                     text-[14px] font-normal text-gray-500 dark:text-gray-400"
          style={{ height: '24px' }}
          aria-hidden="true"
        >
          +{hiddenCount} more
        </span>
      )}
    </div>
  )
}
