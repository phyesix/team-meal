import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ teamId: string }> }
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) {
        return NextResponse.json({ error: 'Admin yetkisi gerekli' }, { status: 403 })
    }

    const { teamId } = await params
    const { name, max_members, vehicle_capacity } = await request.json()

    const updateData: any = {}
    if (name) updateData.name = name
    if (max_members) updateData.max_members = max_members
    if (vehicle_capacity) updateData.vehicle_capacity = vehicle_capacity

    const { error } = await supabase
        .from('teams')
        .update(updateData)
        .eq('id', teamId)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ teamId: string }> }
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) {
        return NextResponse.json({ error: 'Admin yetkisi gerekli' }, { status: 403 })
    }

    const { teamId } = await params

    const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
