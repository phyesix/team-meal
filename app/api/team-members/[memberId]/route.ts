import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteParams {
    params: Promise<{ memberId: string }>
}

export async function PUT(request: Request, { params }: RouteParams) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { memberId } = await params
    const { has_car } = await request.json()

    if (typeof has_car !== 'boolean') {
        return NextResponse.json({ error: 'has_car must be a boolean' }, { status: 400 })
    }

    // Check if user is admin or updating their own membership
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    const { data: member } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('id', memberId)
        .single()

    if (!member) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Only allow if admin or own membership
    if (!profile?.is_admin && member.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
        .from('team_members')
        .update({ has_car })
        .eq('id', memberId)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
