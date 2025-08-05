import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Globe, Users, FileText, Settings, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default async function PortalDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get portal with stats
  const { data: portal } = await supabase
    .from('portals')
    .select(`
      *,
      account:accounts(id, name),
      _count:clients(count),
      files(count),
      invoices(count)
    `)
    .eq('id', params.id)
    .single()

  if (!portal) notFound()

  // Verify user has access to this portal
  const { data: userProfile } = await supabase
    .from('users')
    .select('account_id')
    .eq('id', user.id)
    .single()

  if (portal.account_id !== userProfile?.account_id) {
    redirect('/dashboard/portals')
  }

  const stats = {
    clients: portal._count?.[0]?.count || 0,
    files: portal.files?.[0]?.count || 0,
    invoices: portal.invoices?.[0]?.count || 0,
  }

  return (
    <>
      <div className="mb-8">
        <Link href="/dashboard/portals" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Portals
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{portal.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {portal.slug}.portalpro.app
              {portal.custom_domain && ` • ${portal.custom_domain}`}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href={`https://${portal.slug}.portalpro.app`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary" leftIcon={<ExternalLink className="h-4 w-4" />}>
                View Portal
              </Button>
            </a>
            <Link href={`/dashboard/portals/${portal.id}/settings`}>
              <Button leftIcon={<Settings className="h-4 w-4" />}>
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clients}</div>
            <Link href={`/dashboard/clients?portal=${portal.id}`} className="text-xs text-blue-600 hover:underline">
              Manage clients →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Files</CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.files}</div>
            <Link href={`/dashboard/files?portal=${portal.id}`} className="text-xs text-blue-600 hover:underline">
              Manage files →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices</CardTitle>
            <Globe className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.invoices}</div>
            <Link href={`/dashboard/invoices?portal=${portal.id}`} className="text-xs text-blue-600 hover:underline">
              View invoices →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for this portal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href={`/dashboard/clients/new?portal=${portal.id}`}>
              <Button variant="secondary" className="w-full">
                Invite Client
              </Button>
            </Link>
            <Link href={`/dashboard/files?portal=${portal.id}&action=upload`}>
              <Button variant="secondary" className="w-full">
                Upload Files
              </Button>
            </Link>
            <Link href={`/dashboard/invoices/new?portal=${portal.id}`}>
              <Button variant="secondary" className="w-full">
                Create Invoice
              </Button>
            </Link>
            <Link href={`/dashboard/portals/${portal.id}/settings`}>
              <Button variant="secondary" className="w-full">
                Portal Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No recent activity</p>
            <p className="text-sm mt-2">
              Activity will appear here as clients interact with your portal
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}