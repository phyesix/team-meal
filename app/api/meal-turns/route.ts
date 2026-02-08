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
        return NextResponse.json({ error: 'Team ID required' }, { status: 400 })
    }

    // Get team info
    const { data: team } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single()

    // Get active cycle
    const { data: activeCycle } = await supabase
        .from('cycles')
        .select('*')
        .eq('team_id', teamId)
        .eq('is_active', true)
        .single()

    if (!activeCycle) {
        return NextResponse.json({ team, mealTurns: [], currentTurn: null })
    }

    // Get all meal turns for this cycle
    const { data: mealTurns } = await supabase
        .from('meal_turns')
        .select(`
      *,
      profiles (
        full_name,
        email
      )
    `)
        .eq('cycle_id', activeCycle.id)
        .order('turn_order', { ascending: true })

    // Find current turn (first incomplete turn)
    const currentTurn = mealTurns?.find(turn => !turn.is_completed)
    const isCurrentUser = currentTurn?.user_id === user.id

    return NextResponse.json({
        team,
        mealTurns,
        currentTurn,
        isCurrentUser,
    })
}

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId, turnId, restaurantName, mealDate } = await request.json()

    if (!teamId || !turnId || !restaurantName) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify it's the user's turn
    const { data: turn } = await supabase
        .from('meal_turns')
        .select('*')
        .eq('id', turnId)
        .single()

    if (!turn || turn.user_id !== user.id) {
        return NextResponse.json({ error: 'Not your turn' }, { status: 403 })
    }

    if (turn.is_completed) {
        return NextResponse.json({ error: 'Turn already completed' }, { status: 400 })
    }

    // Get team info for vehicle capacity
    const { data: team } = await supabase
        .from('teams')
        .select('vehicle_capacity')
        .eq('id', teamId)
        .single()

    const vehicleCapacity = team?.vehicle_capacity || 1

    // Get members who have cars
    const { data: membersWithCars } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId)
        .eq('has_car', true)

    if (!membersWithCars || membersWithCars.length === 0) {
        return NextResponse.json({ error: 'Takımda arabası olan üye yok' }, { status: 400 })
    }

    const driverUserIds = membersWithCars.map(m => m.user_id)

    // Count how many times each driver has driven
    const { data: driveCounts } = await supabase
        .from('vehicle_assignments')
        .select('driver_id')

    const driveCountMap: Record<string, number> = {}
    driverUserIds.forEach(id => { driveCountMap[id] = 0 })
    driveCounts?.forEach(assignment => {
        if (driveCountMap[assignment.driver_id] !== undefined) {
            driveCountMap[assignment.driver_id]++
        }
    })

    // Sort drivers by drive count (least first) and select needed number
    const sortedDrivers = driverUserIds.sort((a, b) => driveCountMap[a] - driveCountMap[b])
    const selectedDrivers = sortedDrivers.slice(0, vehicleCapacity)

    // Update meal turn
    const { error: updateError } = await supabase
        .from('meal_turns')
        .update({
            restaurant_name: restaurantName,
            meal_date: mealDate,
            is_completed: true,
            completed_at: new Date().toISOString(),
        })
        .eq('id', turnId)

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Save vehicle assignments with auto-selected drivers
    const vehicleAssignments = selectedDrivers.map((driverId: string) => ({
        meal_turn_id: turnId,
        driver_id: driverId,
    }))

    const { error: assignmentError } = await supabase
        .from('vehicle_assignments')
        .insert(vehicleAssignments)

    if (assignmentError) {
        return NextResponse.json({ error: assignmentError.message }, { status: 500 })
    }

    // Check if all turns are completed
    const { data: allTurns } = await supabase
        .from('meal_turns')
        .select('is_completed')
        .eq('cycle_id', turn.cycle_id)

    const allCompleted = allTurns?.every(t => t.is_completed)

    if (allCompleted) {
        // Mark cycle as completed
        await supabase
            .from('cycles')
            .update({
                is_active: false,
                completed_at: new Date().toISOString(),
            })
            .eq('id', turn.cycle_id)

        // Create new cycle
        const { data: team } = await supabase
            .from('teams')
            .select('id')
            .eq('id', teamId)
            .single()

        if (team) {
            const { data: lastCycle } = await supabase
                .from('cycles')
                .select('cycle_number')
                .eq('team_id', teamId)
                .order('cycle_number', { ascending: false })
                .limit(1)
                .single()

            const nextCycleNumber = (lastCycle?.cycle_number || 0) + 1

            await supabase
                .from('cycles')
                .insert({
                    team_id: teamId,
                    cycle_number: nextCycleNumber,
                })
        }
    }

    return NextResponse.json({ success: true, cycleCompleted: allCompleted })
}
