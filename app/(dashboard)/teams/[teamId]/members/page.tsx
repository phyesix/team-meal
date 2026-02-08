import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import TeamMembersList from '@/components/TeamMembersList'

export default async function TeamMembersPage({
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

    // Get team members with car info
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

    // Get drive counts for each member
    const { data: driveCounts } = await supabase
        .from('vehicle_assignments')
        .select('driver_id')
        .in('driver_id', members?.map(m => m.user_id) || [])

    // Calculate drive counts per member
    const driveCountMap: Record<string, number> = {}
    driveCounts?.forEach(d => {
        driveCountMap[d.driver_id] = (driveCountMap[d.driver_id] || 0) + 1
    })

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <Link href={`/teams/${teamId}`} className="text-indigo-600 hover:text-indigo-700 font-medium">
                    ← Takıma Dön
                </Link>
            </div>

            {/* Header */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                            👥
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Takım Üyeleri</h1>
                            <p className="text-gray-600">{team.name}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{members?.length || 0}</p>
                        <p className="text-sm text-gray-500">/ {team.max_members} üye</p>
                    </div>
                </div>
            </div>

            {/* Members with stats */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Üye Listesi</h2>
                <div className="space-y-3">
                    {(members || []).map((member: any) => {
                        const memberProfile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles
                        const driveCount = driveCountMap[member.user_id] || 0
                        const canEdit = profile?.is_admin || member.user_id === user?.id

                        return (
                            <div key={member.user_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-lg font-semibold text-indigo-600">
                                        {(memberProfile?.full_name || memberProfile?.email || '?')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {memberProfile?.full_name || memberProfile?.email}
                                        </p>
                                        <p className="text-sm text-gray-500">{memberProfile?.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <p className="text-lg font-semibold text-indigo-600">{driveCount}</p>
                                        <p className="text-xs text-gray-500">sürüş</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {member.has_car ? (
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                                🚗 Araba var
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-sm">
                                                Araba yok
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        {new Date(member.joined_at).toLocaleDateString('tr-TR')}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Car Settings */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">🚗 Araç Ayarları</h2>
                <p className="text-sm text-gray-600 mb-4">
                    Araç sahipliğini değiştirmek için aşağıdaki toggle&apos;ları kullanın. Sadece kendi ayarınızı veya admin iseniz tüm üyelerin ayarlarını değiştirebilirsiniz.
                </p>
                <TeamMembersList
                    members={(members || []).map((m: any) => ({
                        ...m,
                        profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
                    }))}
                    currentUserId={user?.id || ''}
                    isAdmin={profile?.is_admin || false}
                />
            </div>
        </div>
    )
}
