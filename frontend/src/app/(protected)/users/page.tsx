'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { useUsers } from '@/hooks/useUsers'
import { UserFilterBar } from '@/components/users/UserFilterBar'
import { UsersTable } from '@/components/users/UsersTable'
import { AddUserDialog } from '@/components/users/AddUserDialog'
import { EditUserDialog } from '@/components/users/EditUserDialog'
import { DeactivateUserConfirmDialog } from '@/components/users/DeactivateUserConfirmDialog'
import { ReactivateUserConfirmDialog } from '@/components/users/ReactivateUserConfirmDialog'
import type { User, UserRole } from '@/types/user'
import type { UserFilters } from '@/hooks/useUsers'

export default function UsersPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const filters: UserFilters = {
    q: searchParams.get('q') || undefined,
    role: (searchParams.get('role') as UserRole) || undefined,
    status: (searchParams.get('status') as 'active' | 'inactive') || undefined,
  }

  const { data: users, isLoading } = useUsers(filters)

  const [addUserOpen, setAddUserOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editUserOpen, setEditUserOpen] = useState(false)
  const [deactivateUserOpen, setDeactivateUserOpen] = useState(false)
  const [reactivateUserOpen, setReactivateUserOpen] = useState(false)

  const clearFilters = useCallback(() => {
    router.push(pathname)
  }, [router, pathname])

  const handleView = useCallback((user: User) => {
    setSelectedUser(user)
    setEditUserOpen(true)
  }, [])

  const handleEdit = useCallback((user: User) => {
    setSelectedUser(user)
    setEditUserOpen(true)
  }, [])

  const handleDeactivate = useCallback((user: User) => {
    setSelectedUser(user)
    setDeactivateUserOpen(true)
  }, [])

  const handleReactivate = useCallback((user: User) => {
    setSelectedUser(user)
    setReactivateUserOpen(true)
  }, [])

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <nav className="text-[14px] text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
            Dashboard › Users
          </nav>
          <h1 className="text-[24px] font-semibold text-gray-900 dark:text-white mt-1">
            Users
          </h1>
        </div>
        {/* Add User CTA — gradient per UI-SPEC */}
        <button
          onClick={() => setAddUserOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[16px]
                     bg-[linear-gradient(135deg,#1D4ED8_0%,#7C3AED_100%)]
                     hover:-translate-y-0.5 hover:brightness-110 transition-all duration-150
                     focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:ring-offset-2"
        >
          <UserPlus className="w-4 h-4" aria-hidden="true" />
          Add User
        </button>
      </div>

      {/* Filter bar */}
      <UserFilterBar />

      {/* Users table */}
      <UsersTable
        users={users}
        isLoading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
        onDeactivate={handleDeactivate}
        onReactivate={handleReactivate}
        onClearFilters={clearFilters}
      />

      {/* Dialogs */}
      <AddUserDialog open={addUserOpen} onOpenChange={setAddUserOpen} />

      <EditUserDialog
        user={selectedUser}
        open={editUserOpen}
        onOpenChange={(open) => {
          setEditUserOpen(open)
          if (!open) setSelectedUser(null)
        }}
      />

      <DeactivateUserConfirmDialog
        user={selectedUser}
        open={deactivateUserOpen}
        onOpenChange={(open) => {
          setDeactivateUserOpen(open)
          if (!open) setSelectedUser(null)
        }}
      />

      <ReactivateUserConfirmDialog
        user={selectedUser}
        open={reactivateUserOpen}
        onOpenChange={(open) => {
          setReactivateUserOpen(open)
          if (!open) setSelectedUser(null)
        }}
      />
    </div>
  )
}
