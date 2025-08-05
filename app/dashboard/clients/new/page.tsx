'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewClientPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [portals, setPortals] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    portal_id: '',
  })
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    async function loadPortals() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userProfile } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', user.id)
        .single()

      if (userProfile?.account_id) {
        const { data } = await supabase
          .from('portals')
          .select('id, name')
          .eq('account_id', userProfile.account_id)
          .order('name')

        if (data) {
          setPortals(data)
          // Set default portal from URL or first portal
          const portalId = searchParams.get('portal') || data[0]?.id || ''
          setFormData(prev => ({ ...prev, portal_id: portalId }))
        }
      }
    }

    loadPortals()
  }, [searchParams, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Create client
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          name: formData.name,
          email: formData.email.toLowerCase(),
          company: formData.company || null,
          portal_id: formData.portal_id,
        })
        .select()
        .single()

      if (clientError) throw clientError

      // TODO: Send invitation email

      router.push('/dashboard/clients')
      router.refresh()
    } catch (err: any) {
      if (err.code === '23505') {
        setError('A client with this email already exists in this portal.')
      } else {
        setError(err.message)
      }
      setLoading(false)
    }
  }

  if (portals.length === 0) {
    return (
      <Card className="max-w-2xl">
        <CardContent className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No portals yet</h3>
          <p className="text-gray-500 mb-4">
            You need to create a portal before inviting clients.
          </p>
          <Link href="/dashboard/portals/new">
            <Button>Create Portal</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="mb-8">
        <Link href="/dashboard/clients" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Clients
        </Link>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Invite Client</CardTitle>
          <CardDescription>
            Send an invitation to give a client access to your portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Portal
              </label>
              <select
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                value={formData.portal_id}
                onChange={(e) => setFormData({ ...formData, portal_id: e.target.value })}
              >
                <option value="">Select a portal</option>
                {portals.map((portal) => (
                  <option key={portal.id} value={portal.id}>
                    {portal.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Client Name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
            />
            
            <Input
              label="Email Address"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              helperText="An invitation will be sent to this email"
            />

            <Input
              label="Company (Optional)"
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Acme Inc."
            />

            <div className="flex gap-4">
              <Button
                type="submit"
                isLoading={loading}
                disabled={loading || !formData.portal_id}
              >
                Send Invitation
              </Button>
              <Link href="/dashboard/clients">
                <Button variant="ghost" disabled={loading}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  )
}