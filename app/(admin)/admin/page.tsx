import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboard() {
    const supabase = await createClient()

    // Get statistics
    const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

    const { count: teamCount } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })

    const { count: activeCycleCount } = await supabase
        .from('cycles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

    const { data: recentTeams } = await supabase
        .from('teams')
        .select(`
      *,
      team_members (count)
    `)
        .order('created_at', { ascending: false })
        .limit(5)

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Paneli</h1>
                <p className="text-gray-600">Sistem yönetimi ve istatistikler</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium mb-1">Toplam Kullanıcı</p>
                            <p className="text-4xl font-bold">{userCount || 0}</p>
                        </div>
                        <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium mb-1">Toplam Takım</p>
                            <p className="text-4xl font-bold">{teamCount || 0}</p>
                        </div>
                        <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium mb-1">Aktif Döngü</p>
                            <p className="text-4xl font-bold">{activeCycleCount || 0}</p>
                        </div>
                        <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Link
                    href="/admin/users"
                    className="group bg-white rounded-2xl shadow-md p-8 hover:shadow-xl transition-all border border-gray-100"
                >
                    <div className="flex items-center mb-4">
                        <div className="bg-blue-100 p-3 rounded-xl mr-4 group-hover:bg-blue-200 transition">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">Kullanıcı Yönetimi</h3>
                    </div>
                    <p className="text-gray-600">Kullanıcıları görüntüle ve yönet, admin yetkisi ver</p>
                    <div className="mt-4 text-blue-600 font-semibold flex items-center">
                        Yönetim Paneline Git
                        <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </Link>

                <Link
                    href="/admin/teams"
                    className="group bg-white rounded-2xl shadow-md p-8 hover:shadow-xl transition-all border border-gray-100"
                >
                    <div className="flex items-center mb-4">
                        <div className="bg-green-100 p-3 rounded-xl mr-4 group-hover:bg-green-200 transition">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">Takım Yönetimi</h3>
                    </div>
                    <p className="text-gray-600">Takımları düzenle, üyeleri yönet, ayarları değiştir</p>
                    <div className="mt-4 text-green-600 font-semibold flex items-center">
                        Yönetim Paneline Git
                        <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </Link>
            </div>

            {/* Recent Teams */}
            <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Son Oluşturulan Takımlar</h2>
                <div className="space-y-3">
                    {recentTeams && recentTeams.length > 0 ? (
                        recentTeams.map((team: any) => (
                            <div key={team.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                                <div>
                                    <p className="font-semibold text-gray-900 text-lg">{team.name}</p>
                                    <p className="text-sm text-gray-600">
                                        {team.team_members[0]?.count || 0} / {team.max_members} üye
                                    </p>
                                </div>
                                <Link
                                    href={`/admin/teams?teamId=${team.id}`}
                                    className="text-blue-600 hover:text-blue-700 font-medium text-sm bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition"
                                >
                                    Düzenle →
                                </Link>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-center py-8">Henüz takım oluşturulmamış</p>
                    )}
                </div>
            </div>
        </div>
    )
}
