'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { MoreHorizontal, Eye, Pencil, UserX, UserCheck } from 'lucide-react'
import type { User } from '@/types/user'

interface UserRowActionsProps {
  user: User
  onView: (user: User) => void
  onEdit: (user: User) => void
  onDeactivate: (user: User) => void
  onReactivate: (user: User) => void
}

export function UserRowActions({
  user,
  onView,
  onEdit,
  onDeactivate,
  onReactivate,
}: UserRowActionsProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700
                     transition-colors focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
          aria-label={`Actions for ${user.username}`}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="w-4 h-4 text-gray-500" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[160px] bg-white dark:bg-[#1A1A1A] rounded-lg
                     shadow-lg border border-gray-200 dark:border-gray-700
                     p-1 z-50"
          sideOffset={4}
          align="end"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 rounded text-[14px]
                       text-gray-700 dark:text-gray-300 cursor-pointer
                       hover:bg-gray-100 dark:hover:bg-gray-800
                       focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800"
            onSelect={() => onView(user)}
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
            <span aria-label={`View user ${user.username}`}>View</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 rounded text-[14px]
                       text-gray-700 dark:text-gray-300 cursor-pointer
                       hover:bg-gray-100 dark:hover:bg-gray-800
                       focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800"
            onSelect={() => onEdit(user)}
          >
            <Pencil className="w-4 h-4" aria-hidden="true" />
            <span aria-label={`Edit user ${user.username}`}>Edit</span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

          {user.isActive ? (
            <DropdownMenu.Item
              className="flex items-center gap-2 px-3 py-2 rounded text-[14px]
                         text-[#DC2626] dark:text-[#F87171] cursor-pointer
                         hover:bg-red-50 dark:hover:bg-red-900/20
                         focus:outline-none focus:bg-red-50 dark:focus:bg-red-900/20"
              onSelect={() => onDeactivate(user)}
            >
              <UserX className="w-4 h-4" aria-hidden="true" />
              <span aria-label={`Deactivate ${user.username}`}>Deactivate</span>
            </DropdownMenu.Item>
          ) : (
            <DropdownMenu.Item
              className="flex items-center gap-2 px-3 py-2 rounded text-[14px]
                         text-[#16A34A] dark:text-[#4ADE80] cursor-pointer
                         hover:bg-green-50 dark:hover:bg-green-900/20
                         focus:outline-none focus:bg-green-50 dark:focus:bg-green-900/20"
              onSelect={() => onReactivate(user)}
            >
              <UserCheck className="w-4 h-4" aria-hidden="true" />
              <span aria-label={`Reactivate ${user.username}`}>Reactivate</span>
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
