import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import TeamMembersList from '@/components/TeamMembersList'

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

    // Get user profile for admin check
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user?.id || '')
        .single()

    // Get team members
    const { data: members } = await supabase
        .from('team_members')
        .select(`
      id,
      user_id,
      has_car,
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

            {/* Team Header */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-lg p-8 mb-6 text-white relative overflow-hidden">
                {/* Subtle accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500"></div>

                <div className="relative">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-indigo-500/20 border border-indigo-400/30 rounded-xl flex items-center justify-center text-2xl">
                                👥
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{team.name}</h1>
                                <p className="text-slate-400 text-sm">Takım Yönetimi</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-slate-700/50 border border-slate-600/50 rounded-xl p-4">
                            <div className="text-slate-400 text-xs mb-1">👤 Üyeler</div>
                            <div className="text-xl font-semibold">{members?.length || 0}<span className="text-slate-500 text-sm">/{team.max_members}</span></div>
                        </div>
                        <div className="bg-slate-700/50 border border-slate-600/50 rounded-xl p-4">
                            <div className="text-slate-400 text-xs mb-1">🚗 Araç</div>
                            <div className="text-xl font-semibold">{team.vehicle_capacity} <span className="text-slate-500 text-sm">kişi</span></div>
                        </div>
                        <div className="bg-slate-700/50 border border-slate-600/50 rounded-xl p-4">
                            <div className="text-slate-400 text-xs mb-1">🔄 Döngü</div>
                            <div className="text-xl font-semibold">#{activeCycle?.cycle_number || '-'}</div>
                        </div>
                        <div className="bg-slate-700/50 border border-slate-600/50 rounded-xl p-4">
                            <div className="text-slate-400 text-xs mb-1">🎲 Zar</div>
                            <div className="text-xl font-semibold">{diceRolls?.length || 0}<span className="text-slate-500 text-sm">/{members?.length || 0}</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {!allMembersRolled && (
                    <Link
                        href={`/teams/${teamId}/dice-roll`}
                        className="group bg-white rounded-xl shadow-md hover:shadow-lg p-5 transition border border-gray-100 hover:border-indigo-200"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-100 group-hover:bg-indigo-200 rounded-xl flex items-center justify-center text-2xl transition">
                                🎲
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">Zar At</p>
                                <p className="text-xs text-gray-500">Sıra belirle</p>
                            </div>
                        </div>
                    </Link>
                )}
                {allMembersRolled && (
                    <Link
                        href={`/teams/${teamId}/rotation`}
                        className="group bg-white rounded-xl shadow-md hover:shadow-lg p-5 transition border border-gray-100 hover:border-green-200"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 group-hover:bg-green-200 rounded-xl flex items-center justify-center text-2xl transition">
                                🍽️
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">Rotasyon</p>
                                <p className="text-xs text-gray-500">Yemek sırası</p>
                            </div>
                        </div>
                    </Link>
                )}
                <Link
                    href={`/teams/${teamId}/history`}
                    className="group bg-white rounded-xl shadow-md hover:shadow-lg p-5 transition border border-gray-100 hover:border-purple-200"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 group-hover:bg-purple-200 rounded-xl flex items-center justify-center text-2xl transition">
                            📋
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Geçmiş</p>
                            <p className="text-xs text-gray-500">Tüm döngüler</p>
                        </div>
                    </div>
                </Link>
                <Link
                    href={`/teams/${teamId}/members`}
                    className="group bg-white rounded-xl shadow-md hover:shadow-lg p-5 transition border border-gray-100 hover:border-blue-200"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-xl flex items-center justify-center text-2xl transition">
                            👥
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Üyeler</p>
                            <p className="text-xs text-gray-500">Takım yönetimi</p>
                        </div>
                    </div>
                </Link>
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
