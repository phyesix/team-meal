import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get('cycleId')
    const teamId = searchParams.get('teamId')

    if (!cycleId && !teamId) {
        return NextResponse.json({ error: 'cycleId or teamId required' }, { status: 400 })
    }

    let targetCycleId = cycleId

    // If no cycleId, get the most recently completed cycle for the team
    if (!targetCycleId && teamId) {
        const { data: lastCompletedCycle } = await supabase
            .from('cycles')
            .select('id')
            .eq('team_id', teamId)
            .eq('is_active', false)
            .order('completed_at', { ascending: false })
            .limit(1)
            .single()

        if (!lastCompletedCycle) {
            return NextResponse.json({ error: 'No completed cycles found' }, { status: 404 })
        }
        targetCycleId = lastCompletedCycle.id
    }

    // Get cycle info
    const { data: cycle } = await supabase
        .from('cycles')
        .select('*, teams(name)')
        .eq('id', targetCycleId)
        .single()

    if (!cycle) {
        return NextResponse.json({ error: 'Cycle not found' }, { status: 404 })
    }

    // Get all meal turns for this cycle with restaurant info
    const { data: mealTurns } = await supabase
        .from('meal_turns')
        .select(`
            *,
            profiles (
                full_name,
                email
            )
        `)
        .eq('cycle_id', targetCycleId)
        .order('turn_order', { ascending: true })

    // Get vehicle assignments for all turns in this cycle
    const turnIds = mealTurns?.map(t => t.id) || []
    const { data: vehicleAssignments } = await supabase
        .from('vehicle_assignments')
        .select(`
            *,
            profiles:driver_id (
                full_name,
                email
            )
        `)
        .in('meal_turn_id', turnIds)

    // Calculate driver statistics
    const driverStats: Record<string, { name: string, count: number }> = {}
    vehicleAssignments?.forEach(assignment => {
        const driverId = assignment.driver_id
        const driverName = assignment.profiles?.full_name || assignment.profiles?.email || 'Bilinmiyor'
        if (!driverStats[driverId]) {
            driverStats[driverId] = { name: driverName, count: 0 }
        }
        driverStats[driverId].count++
    })

    // Get unique restaurants
    const restaurants = mealTurns
        ?.filter(t => t.restaurant_name)
        .map(t => ({
            name: t.restaurant_name,
            date: t.meal_date,
            host: t.profiles?.full_name || t.profiles?.email
        })) || []

    return NextResponse.json({
        cycle: {
            id: cycle.id,
            cycleNumber: cycle.cycle_number,
            teamName: cycle.teams?.name,
            startedAt: cycle.started_at,
            completedAt: cycle.completed_at,
        },
        restaurants,
        driverStats: Object.values(driverStats).sort((a, b) => b.count - a.count),
        totalMeals: mealTurns?.length || 0,
        totalDrives: vehicleAssignments?.length || 0,
    })
}
