import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()

    const { data: teams, error } = await supabase
        .from('teams')
        .select(`
      *,
      team_members (count)
    `)
        .order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ teams })
}

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) {
        return NextResponse.json({ error: 'Admin yetkisi gerekli' }, { status: 403 })
    }

    const { name, max_members } = await request.json()

    if (!name || !max_members) {
        return NextResponse.json({ error: 'Takım adı ve maksimum üye sayısı gerekli' }, { status: 400 })
    }

    const { data: team, error } = await supabase
        .from('teams')
        .insert({
            name,
            max_members,
            created_by: user.id,
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ team })
}
