import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's account
  const { data: userProfile } = await supabase
    .from('users')
    .select('account_id')
    .eq('id', user.id)
    .single()

  if (!userProfile?.account_id) {
    return NextResponse.json({ error: 'No account found' }, { status: 404 })
  }

  // Get portals
  const { data: portals, error } = await supabase
    .from('portals')
    .select('*')
    .eq('account_id', userProfile.account_id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(portals)
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's account
  const { data: userProfile } = await supabase
    .from('users')
    .select('account_id')
    .eq('id', user.id)
    .single()

  if (!userProfile?.account_id) {
    return NextResponse.json({ error: 'No account found' }, { status: 404 })
  }

  const body = await request.json()
  const { name, slug } = body

  // Validate slug
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: 'Invalid slug. Use only lowercase letters, numbers, and hyphens.' },
      { status: 400 }
    )
  }

  // Check if slug is available
  const { data: existingPortal } = await supabase
    .from('portals')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existingPortal) {
    return NextResponse.json(
      { error: 'This URL is already taken.' },
      { status: 400 }
    )
  }

  // Create portal
  const { data: portal, error } = await supabase
    .from('portals')
    .insert({
      name,
      slug,
      account_id: userProfile.account_id,
      created_by_id: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(portal, { status: 201 })
}