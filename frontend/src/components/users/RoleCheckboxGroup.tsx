'use client'

import * as Checkbox from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import type { UserRole } from '@/types/user'

const ROLES: Array<{
  value: UserRole
  name: string
  description: string
}> = [
  {
    value: 'REVIEWER',
    name: 'Reviewer',
    description: 'Can upload and view classifications',
  },
  {
    value: 'MANAGER',
    name: 'Manager',
    description: 'Can view reports and analytics',
  },
  {
    value: 'TAXONOMY_ADMIN',
    name: 'Taxonomy Admin',
    description: 'Can manage the taxonomy tree',
  },
  {
    value: 'ADMIN',
    name: 'Admin',
    description: 'Full platform access and user management',
  },
  {
    value: 'VIEWER',
    name: 'Viewer',
    description: 'Read-only access to classifications',
  },
]

interface RoleCheckboxGroupProps {
  value: UserRole[]
  onChange: (roles: UserRole[]) => void
  error?: string
}

export function RoleCheckboxGroup({ value, onChange, error }: RoleCheckboxGroupProps) {
  const handleCheckedChange = (role: UserRole, checked: boolean | 'indeterminate') => {
    if (checked === true) {
      onChange([...value, role])
    } else {
      onChange(value.filter((r) => r !== role))
    }
  }

  return (
    <div role="group" aria-labelledby="role-group-label" className="flex flex-col gap-1">
      <span
        id="role-group-label"
        className="text-[16px] text-gray-700 dark:text-gray-300 mb-2"
      >
        Roles <span className="text-[#DC2626]">*</span>
      </span>

      {ROLES.map((role) => (
        <div
          key={role.value}
          className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <Checkbox.Root
            id={`role-${role.value}`}
            checked={value.includes(role.value)}
            onCheckedChange={(checked) => handleCheckedChange(role.value, checked)}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded
                       border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-900
                       data-[state=checked]:bg-[#1D4ED8] data-[state=checked]:border-[#1D4ED8]
                       focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:ring-offset-1
                       transition-colors mt-0.5"
            aria-describedby={`role-${role.value}-desc`}
          >
            <Checkbox.Indicator>
              <Check className="w-3 h-3 text-white" />
            </Checkbox.Indicator>
          </Checkbox.Root>

          <div className="flex flex-col">
            <label
              htmlFor={`role-${role.value}`}
              className="text-[16px] font-bold text-gray-900 dark:text-gray-100 cursor-pointer"
            >
              {role.name}
            </label>
            <span
              id={`role-${role.value}-desc`}
              className="text-[14px] text-gray-500 dark:text-gray-400"
            >
              {role.description}
            </span>
          </div>
        </div>
      ))}

      {error && (
        <span className="text-[14px] text-[#DC2626] mt-1" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
