import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, full_name, email')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) {
        redirect('/teams')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Admin Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-8">
                            <Link href="/admin" className="flex items-center">
                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    👑 Admin Panel
                                </span>
                            </Link>
                            <nav className="hidden md:flex space-x-4">
                                <Link
                                    href="/admin"
                                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-lg text-sm font-semibold transition hover:bg-blue-50"
                                >
                                    📊 Dashboard
                                </Link>
                                <Link
                                    href="/admin/users"
                                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-lg text-sm font-semibold transition hover:bg-blue-50"
                                >
                                    👥 Kullanıcılar
                                </Link>
                                <Link
                                    href="/admin/teams"
                                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-lg text-sm font-semibold transition hover:bg-blue-50"
                                >
                                    🏆 Takımlar
                                </Link>
                            </nav>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-gray-900">{profile.full_name || 'Admin'}</p>
                                <p className="text-xs text-gray-500">{profile.email}</p>
                            </div>
                            <Link
                                href="/teams"
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
                            >
                                ← Ana Sayfa
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main>
                {children}
            </main>
        </div>
    )
}
