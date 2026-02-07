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

    // Get active cycle for team
    const { data: activeCycle } = await supabase
        .from('cycles')
        .select('id')
        .eq('team_id', teamId)
        .eq('is_active', true)
        .single()

    if (!activeCycle) {
        return NextResponse.json({ activeCycle: null, userRoll: null })
    }

    // Check if user has rolled
    const { data: userRoll } = await supabase
        .from('dice_rolls')
        .select('*')
        .eq('cycle_id', activeCycle.id)
        .eq('user_id', user.id)
        .single()

    return NextResponse.json({ activeCycle, userRoll })
}

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId, die1, die2 } = await request.json()

    if (!teamId || !die1 || !die2) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (die1 < 1 || die1 > 10 || die2 < 1 || die2 > 10) {
        return NextResponse.json({ error: 'Invalid dice values' }, { status: 400 })
    }

    // Get or create active cycle
    let { data: activeCycle } = await supabase
        .from('cycles')
        .select('*')
        .eq('team_id', teamId)
        .eq('is_active', true)
        .single()

    if (!activeCycle) {
        // Get the next cycle number
        const { data: lastCycle } = await supabase
            .from('cycles')
            .select('cycle_number')
            .eq('team_id', teamId)
            .order('cycle_number', { ascending: false })
            .limit(1)
            .single()

        const nextCycleNumber = (lastCycle?.cycle_number || 0) + 1

        // Create new cycle
        const { data: newCycle, error: cycleError } = await supabase
            .from('cycles')
            .insert({
                team_id: teamId,
                cycle_number: nextCycleNumber,
            })
            .select()
            .single()

        if (cycleError) {
            return NextResponse.json({ error: cycleError.message }, { status: 500 })
        }

        activeCycle = newCycle
    }

    // Check if user already rolled
    const { data: existingRoll } = await supabase
        .from('dice_rolls')
        .select('id')
        .eq('cycle_id', activeCycle.id)
        .eq('user_id', user.id)
        .single()

    if (existingRoll) {
        return NextResponse.json({ error: 'Zaten zar attınız' }, { status: 400 })
    }

    // Save dice roll
    const { error: rollError } = await supabase
        .from('dice_rolls')
        .insert({
            cycle_id: activeCycle.id,
            user_id: user.id,
            die1,
            die2,
        })

    if (rollError) {
        return NextResponse.json({ error: rollError.message }, { status: 500 })
    }

    // Check if all team members have rolled
    const { data: teamMembers } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId)

    const { data: diceRolls } = await supabase
        .from('dice_rolls')
        .select('user_id')
        .eq('cycle_id', activeCycle.id)

    const allRolled = teamMembers?.length === diceRolls?.length

    if (allRolled) {
        // Create meal turns based on dice roll rankings
        const { data: rankedRolls } = await supabase
            .from('dice_rolls')
            .select('user_id, die1, die2, total')
            .eq('cycle_id', activeCycle.id)
            .order('total', { ascending: false })
            .order('die1', { ascending: false })
            .order('rolled_at', { ascending: true })

        if (rankedRolls) {
            const mealTurns = rankedRolls.map((roll, index) => ({
                cycle_id: activeCycle!.id,
                user_id: roll.user_id,
                turn_order: index + 1,
                week_number: index + 1,
            }))

            await supabase.from('meal_turns').insert(mealTurns)
        }
    }

    return NextResponse.json({ success: true, allRolled })
}
