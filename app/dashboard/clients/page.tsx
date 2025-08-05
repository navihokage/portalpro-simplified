import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Users, Mail, Building, MoreVertical } from 'lucide-react'
import Link from 'next/link'

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { portal?: string }
}) {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get user's account
  const { data: userProfile } = await supabase
    .from('users')
    .select('account_id')
    .eq('id', user.id)
    .single()

  if (!userProfile?.account_id) redirect('/dashboard/setup')

  // Build query
  let query = supabase
    .from('clients')
    .select(`
      *,
      portal:portals!inner(id, name, account_id)
    `)
    .eq('portal.account_id', userProfile.account_id)
    .order('created_at', { ascending: false })

  // Filter by portal if specified
  if (searchParams.portal) {
    query = query.eq('portal_id', searchParams.portal)
  }

  const { data: clients } = await query

  // Get portals for filter dropdown
  const { data: portals } = await supabase
    .from('portals')
    .select('id, name')
    .eq('account_id', userProfile.account_id)
    .order('name')

  return (
    <>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage client access to your portals.
          </p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>
            Invite Client
          </Button>
        </Link>
      </div>

      {/* Filters */}
      {portals && portals.length > 1 && (
        <div className="mb-6">
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={searchParams.portal || ''}
            onChange={(e) => {
              const url = new URL(window.location.href)
              if (e.target.value) {
                url.searchParams.set('portal', e.target.value)
              } else {
                url.searchParams.delete('portal')
              }
              window.location.href = url.toString()
            }}
          >
            <option value="">All Portals</option>
            {portals.map((portal) => (
              <option key={portal.id} value={portal.id}>
                {portal.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {clients && clients.length > 0 ? (
        <div className="grid gap-4">
          {clients.map((client) => (
            <Card key={client.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <Users className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </span>
                      {client.company && (
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {client.company}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {client.portal.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {client.accepted_at ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-yellow-600">Invited</span>
                      )}
                    </p>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded">
                    <MoreVertical className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
            <p className="text-gray-500 mb-4">
              Invite clients to give them access to your portals.
            </p>
            <Link href="/dashboard/clients/new">
              <Button leftIcon={<Plus className="h-4 w-4" />}>
                Invite Client
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </>
  )
}