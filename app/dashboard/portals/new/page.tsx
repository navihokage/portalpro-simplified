'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewPortalPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
  })
  
  const router = useRouter()
  const supabase = createClient()

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    
    setFormData({ name, slug })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get user's account
      const { data: userProfile } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', user.id)
        .single()

      if (!userProfile?.account_id) throw new Error('No account found')

      // Check if slug is available
      const { data: existingPortal } = await supabase
        .from('portals')
        .select('id')
        .eq('slug', formData.slug)
        .single()

      if (existingPortal) {
        throw new Error('This URL is already taken. Please choose another.')
      }

      // Create portal
      const { data: portal, error: portalError } = await supabase
        .from('portals')
        .insert({
          name: formData.name,
          slug: formData.slug,
          account_id: userProfile.account_id,
          created_by_id: user.id,
        })
        .select()
        .single()

      if (portalError) throw portalError

      router.push(`/dashboard/portals/${portal.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-8">
        <Link href="/dashboard/portals" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Portals
        </Link>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Create New Portal</CardTitle>
          <CardDescription>
            Set up a new client portal for your business.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            
            <Input
              label="Portal Name"
              type="text"
              required
              value={formData.name}
              onChange={handleNameChange}
              placeholder="My Client Portal"
              helperText="This is what your clients will see"
            />
            
            <div className="space-y-2">
              <Input
                label="Portal URL"
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="my-portal"
                helperText="Letters, numbers, and hyphens only"
                pattern="[a-z0-9-]+"
              />
              <p className="text-sm text-gray-500">
                Your portal will be available at: 
                <span className="font-medium text-gray-700"> {formData.slug || 'your-portal'}.portalpro.app</span>
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                isLoading={loading}
                disabled={loading}
              >
                Create Portal
              </Button>
              <Link href="/dashboard/portals">
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