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

    const { teamId, turnId, restaurantName, mealDate, drivers } = await request.json()

    if (!teamId || !turnId || !restaurantName || !drivers || drivers.length === 0) {
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

    // Save vehicle assignments
    const vehicleAssignments = drivers.map((driverId: string) => ({
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
