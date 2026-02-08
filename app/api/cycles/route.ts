import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    if (!teamId) {
        return NextResponse.json({ error: 'teamId required' }, { status: 400 })
    }

    // Check if user is a member of this team
    const { data: membership } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single()

    if (!membership) {
        return NextResponse.json({ error: 'Not a team member' }, { status: 403 })
    }

    // Get all cycles for this team
    const { data: cycles } = await supabase
        .from('cycles')
        .select('*')
        .eq('team_id', teamId)
        .order('cycle_number', { ascending: false })

    if (!cycles || cycles.length === 0) {
        return NextResponse.json({ cycles: [] })
    }

    // Get meal turn counts and restaurant info for each cycle
    const cycleIds = cycles.map(c => c.id)

    const { data: mealTurns } = await supabase
        .from('meal_turns')
        .select('cycle_id, is_completed, restaurant_name')
        .in('cycle_id', cycleIds)

    // Calculate stats for each cycle
    const cycleStats = cycles.map(cycle => {
        const turns = mealTurns?.filter(t => t.cycle_id === cycle.id) || []
        const completedTurns = turns.filter(t => t.is_completed)
        const restaurants = turns
            .filter(t => t.restaurant_name)
            .map(t => t.restaurant_name)

        return {
            id: cycle.id,
            cycleNumber: cycle.cycle_number,
            isActive: cycle.is_active,
            startedAt: cycle.started_at,
            completedAt: cycle.completed_at,
            totalTurns: turns.length,
            completedTurns: completedTurns.length,
            restaurants: restaurants.slice(0, 3), // Show first 3 restaurants
            totalRestaurants: restaurants.length,
        }
    })

    return NextResponse.json({ cycles: cycleStats })
}
