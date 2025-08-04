import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Globe, ExternalLink, Settings } from 'lucide-react'
import Link from 'next/link'

export default async function PortalsPage() {
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

  // Get portals
  const { data: portals } = await supabase
    .from('portals')
    .select('*, clients(count)')
    .eq('account_id', userProfile.account_id)
    .order('created_at', { ascending: false })

  return (
    <>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portals</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage client portals for your business.
          </p>
        </div>
        <Link href="/dashboard/portals/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>
            Create Portal
          </Button>
        </Link>
      </div>

      {portals && portals.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {portals.map((portal) => (
            <Card key={portal.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {portal.logo ? (
                      <img src={portal.logo} alt={portal.name} className="h-10 w-10 rounded" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-blue-100 flex items-center justify-center">
                        <Globe className="h-6 w-6 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{portal.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {portal.slug}.portalpro.app
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Clients</span>
                    <span className="font-medium">{portal.clients?.[0]?.count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Status</span>
                    <span className={`font-medium ${portal.active ? 'text-green-600' : 'text-gray-400'}`}>
                      {portal.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="pt-3 flex gap-2">
                    <a
                      href={`https://${portal.slug}.portalpro.app`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="secondary" size="sm" className="w-full">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </a>
                    <Link href={`/dashboard/portals/${portal.id}`} className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full">
                        <Settings className="h-4 w-4 mr-1" />
                        Manage
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No portals yet</h3>
            <p className="text-gray-500 mb-4">
              Create your first client portal to get started.
            </p>
            <Link href="/dashboard/portals/new">
              <Button leftIcon={<Plus className="h-4 w-4" />}>
                Create Portal
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </>
  )
}