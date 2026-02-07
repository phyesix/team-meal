import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

export default async function TeamDetailPage({
    params,
}: {
    params: Promise<{ teamId: string }>
}) {
    const { teamId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get team details
    const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single()

    if (teamError || !team) {
        notFound()
    }

    // Check if user is a member
    const { data: membership } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', user?.id || '')
        .single()

    if (!membership) {
        redirect('/teams')
    }

    // Get team members
    const { data: members } = await supabase
        .from('team_members')
        .select(`
      user_id,
      joined_at,
      profiles (
        full_name,
        email
      )
    `)
        .eq('team_id', teamId)
        .order('joined_at', { ascending: true })

    // Get active cycle
    const { data: activeCycle } = await supabase
        .from('cycles')
        .select('*')
        .eq('team_id', teamId)
        .eq('is_active', true)
        .single()

    // Get dice rolls for active cycle
    let diceRolls = null
    if (activeCycle) {
        const { data } = await supabase
            .from('dice_rolls')
            .select(`
        *,
        profiles (
          full_name,
          email
        )
      `)
            .eq('cycle_id', activeCycle.id)
            .order('total', { ascending: false })

        diceRolls = data
    }

    const allMembersRolled = diceRolls && diceRolls.length === members?.length

    return (
        <div>
            <div className="mb-6">
                <Link href="/teams" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    ← Takımlara Dön
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{team.name}</h1>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">Üye Sayısı:</span>
                        <span className="ml-2 font-semibold">{members?.length || 0} / {team.max_members}</span>
                    </div>
                    <div>
                        <span className="text-gray-600">Araç Kapasitesi:</span>
                        <span className="ml-2 font-semibold">{team.vehicle_capacity} kişi</span>
                    </div>
                </div>
            </div>

            {/* Navigation tabs */}
            <div className="flex gap-4 mb-6">
                <Link
                    href={`/teams/${teamId}/dice-roll`}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                    🎲 Zar At
                </Link>
                {allMembersRolled && (
                    <Link
                        href={`/teams/${teamId}/rotation`}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                    >
                        🍽️ Rotasyon
                    </Link>
                )}
            </div>

            {/* Members list */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Takım Üyeleri</h2>
                <div className="space-y-3">
                    {members?.map((member: any, index: number) => (
                        <div key={member.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-semibold text-gray-900">
                                    {member.profiles?.full_name || member.profiles?.email}
                                </p>
                                <p className="text-sm text-gray-600">{member.profiles?.email}</p>
                            </div>
                            <span className="text-sm text-gray-500">
                                {new Date(member.joined_at).toLocaleDateString('tr-TR')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dice rolls status */}
            {activeCycle && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Döngü #{activeCycle.cycle_number} - Zar Durumu
                    </h2>
                    {diceRolls && diceRolls.length > 0 ? (
                        <div className="space-y-3">
                            {diceRolls.map((roll: any, index: number) => (
                                <div key={roll.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-bold text-indigo-600">#{index + 1}</span>
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {roll.profiles?.full_name || roll.profiles?.email}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Zarlar: {roll.die1} + {roll.die2}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-2xl font-bold text-gray-900">{roll.total}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-600">Henüz kimse zar atmadı</p>
                    )}
                    <div className="mt-4 text-sm text-gray-600">
                        {diceRolls?.length || 0} / {members?.length || 0} üye zar attı
                    </div>
                </div>
            )}
        </div>
    )
}
