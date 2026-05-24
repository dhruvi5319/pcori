'use client'

import { formatRelativeDate } from '@/lib/utils'
import { UserRoleChips } from './UserRoleChips'
import { UserStatusBadge } from './UserStatusBadge'
import { UserRowActions } from './UserRowActions'
import { UsersTableSkeleton } from './UsersTableSkeleton'
import { UsersEmptyState } from './UsersEmptyState'
import type { User } from '@/types/user'

interface UsersTableProps {
  users?: User[]
  isLoading: boolean
  onView: (user: User) => void
  onEdit: (user: User) => void
  onDeactivate: (user: User) => void
  onReactivate: (user: User) => void
  onClearFilters?: () => void
}

const COLUMNS = [
  { key: 'username', label: 'Username', width: '120px' },
  { key: 'email', label: 'Email', width: '200px' },
  { key: 'fullName', label: 'Full Name', width: '160px' },
  { key: 'roles', label: 'Roles', width: '120px' },
  { key: 'status', label: 'Status', width: '140px' },
  { key: 'lastLogin', label: 'Last Login', width: '110px' },
  { key: 'actions', label: '', width: '60px' },
]

export function UsersTable({
  users,
  isLoading,
  onView,
  onEdit,
  onDeactivate,
  onReactivate,
  onClearFilters,
}: UsersTableProps) {
  const isEmpty = !isLoading && (!users || users.length === 0)

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" role="table" aria-label="Users">
          {/* Sticky header */}
          <thead className="sticky top-0 z-10 bg-[#F4F6F9] dark:bg-[#141414] border-b border-gray-200 dark:border-gray-800">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-[14px] font-normal text-gray-500 dark:text-gray-400 whitespace-nowrap"
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <UsersTableSkeleton />}
            {isEmpty && !isLoading && (
              <tr>
                <td colSpan={COLUMNS.length}>
                  <UsersEmptyState onClearFilters={onClearFilters} />
                </td>
              </tr>
            )}
            {!isLoading &&
              users?.map((user) => (
                <tr
                  key={user.id}
                  className={`group cursor-pointer border-b border-gray-100 dark:border-gray-800
                    shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]
                    hover:shadow-[0_4px_16px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.06)]
                    hover:-translate-y-[1px] hover:bg-white dark:hover:bg-[#1A1A1A]
                    bg-[#F4F6F9] dark:bg-[#141414]
                    transition-all duration-150 ease-out
                    ${!user.isActive ? 'opacity-75' : ''}`}
                  style={{ height: '52px' }}
                  onClick={() => onView(user)}
                  role="row"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onView(user)}
                >
                  {/* Username — Geist Mono 14px/600 */}
                  <td className="px-4 py-0 w-[120px]">
                    <span className="font-mono text-[14px] font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                      {user.username}
                    </span>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-0 w-[200px]">
                    <span
                      className="block truncate text-[14px] text-gray-700 dark:text-gray-300"
                      title={user.email}
                    >
                      {user.email}
                    </span>
                  </td>

                  {/* Full Name */}
                  <td className="px-4 py-0 w-[160px]">
                    <span className="text-[14px] text-gray-900 dark:text-gray-100">
                      {user.firstName} {user.lastName}
                    </span>
                  </td>

                  {/* Roles */}
                  <td className="px-4 py-0 w-[120px]">
                    <UserRoleChips roles={user.roles} />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-0 w-[140px]">
                    <UserStatusBadge user={user} />
                  </td>

                  {/* Last Login */}
                  <td
                    className="px-4 py-0 w-[110px] text-[14px] text-gray-500 dark:text-gray-400"
                    title={user.lastLoginAt}
                  >
                    {user.lastLoginAt ? formatRelativeDate(user.lastLoginAt) : 'Never'}
                  </td>

                  {/* Actions — MoreHorizontal dropdown */}
                  <td
                    className="px-4 py-0 w-[60px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <UserRowActions
                        user={user}
                        onView={onView}
                        onEdit={onEdit}
                        onDeactivate={onDeactivate}
                        onReactivate={onReactivate}
                      />
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
