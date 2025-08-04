'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accountName, setAccountName] = useState('')
  const [userName, setUserName] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create account
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .insert({
          name: accountName,
          plan: 'STARTER'
        })
        .select()
        .single()

      if (accountError) throw accountError

      // Update user profile
      const { error: userError } = await supabase
        .from('users')
        .update({
          name: userName,
          account_id: account.id,
          role: 'OWNER'
        })
        .eq('id', user.id)

      if (userError) throw userError

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to PortalPro!</CardTitle>
          <CardDescription>
            Let's get your account set up in just a few steps.
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
              label="Your Name"
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="John Doe"
            />
            
            <Input
              label="Company Name"
              type="text"
              required
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Acme Inc."
              helperText="This will be shown to your clients"
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={loading}
              disabled={loading}
            >
              Complete Setup
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}