import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ teamId: string }> }
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId } = await params

    // Check if team exists and get max members
    const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('max_members, team_members(count)')
        .eq('id', teamId)
        .single()

    if (teamError || !team) {
        return NextResponse.json({ error: 'Takım bulunamadı' }, { status: 404 })
    }

    const currentMemberCount = team.team_members[0]?.count || 0

    if (currentMemberCount >= team.max_members) {
        return NextResponse.json({ error: 'Takım dolu' }, { status: 400 })
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single()

    if (existingMember) {
        return NextResponse.json({ error: 'Zaten bu takımın üyesisiniz' }, { status: 400 })
    }

    // Add user to team
    const { error: joinError } = await supabase
        .from('team_members')
        .insert({
            team_id: teamId,
            user_id: user.id,
        })

    if (joinError) {
        return NextResponse.json({ error: joinError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
