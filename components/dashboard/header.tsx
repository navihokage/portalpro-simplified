'use client'

import { Avatar } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Bell, Search } from 'lucide-react'

interface HeaderProps {
  user: {
    email?: string
    name?: string
  }
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Search */}
          <div className="flex flex-1 items-center">
            <div className="w-full max-w-lg">
              <label htmlFor="search" className="sr-only">
                Search
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Search portals, clients, files..."
                  type="search"
                />
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="ml-4 flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-1 text-gray-400 hover:text-gray-500">
              <Bell className="h-6 w-6" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
            </button>

            {/* User menu */}
            <DropdownMenu
              trigger={
                <button className="flex items-center">
                  <Avatar
                    src=""
                    alt={user.name || user.email}
                    fallback={user.email?.charAt(0).toUpperCase()}
                  />
                </button>
              }
            >
              <div className="px-4 py-3">
                <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <a href="/dashboard/settings">Settings</a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <a href="/dashboard/billing">Billing</a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <form action="/api/auth/signout" method="POST">
                <DropdownMenuItem type="submit">Sign out</DropdownMenuItem>
              </form>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}