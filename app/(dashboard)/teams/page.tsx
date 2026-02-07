import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import TeamCard from '@/components/TeamCard'

export default async function TeamsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user?.id)
        .single()

    // Get all teams with member count
    const { data: teams } = await supabase
        .from('teams')
        .select(`
      *,
      team_members (count)
    `)
        .order('created_at', { ascending: false })

    // Get user's team memberships
    const { data: userTeams } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user?.id || '')

    const userTeamIds = new Set(userTeams?.map(t => t.team_id) || [])

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Takımlar</h1>
                    <p className="text-gray-600 mt-1">Bir takıma katılın veya yeni takım oluşturun</p>
                </div>
                {profile?.is_admin && (
                    <Link
                        href="/teams/create"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                    >
                        + Yeni Takım Oluştur
                    </Link>
                )}
            </div>

            {teams && teams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map((team: any) => (
                        <TeamCard
                            key={team.id}
                            team={team}
                            memberCount={team.team_members[0]?.count || 0}
                            isMember={userTeamIds.has(team.id)}
                            userId={user?.id || ''}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-500 text-lg mb-4">Henüz takım oluşturulmamış</p>
                    {profile?.is_admin && (
                        <Link
                            href="/teams/create"
                            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                        >
                            İlk Takımı Oluştur
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}
