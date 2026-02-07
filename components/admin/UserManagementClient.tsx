'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
    id: string
    email: string
    full_name: string | null
    is_admin: boolean
    created_at: string
    team_members: Array<{
        team_id: string
        teams: {
            name: string
        }
    }>
}

export default function UserManagementClient({ users }: { users: User[] }) {
    const [loading, setLoading] = useState<string | null>(null)
    const router = useRouter()

    const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
        if (!confirm(`Bu kullanıcının admin yetkisini ${currentStatus ? 'kaldırmak' : 'vermek'} istediğinizden emin misiniz?`)) {
            return
        }

        setLoading(userId)
        try {
            const response = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    isAdmin: !currentStatus,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                alert(error.error || 'İşlem başarısız')
                return
            }

            router.refresh()
        } catch (error) {
            alert('Bir hata oluştu')
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Kullanıcı
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Takımlar
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Kayıt Tarihi
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Durum
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            İşlemler
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                    {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                    <div className="text-sm font-semibold text-gray-900">
                                        {user.full_name || 'İsimsiz'}
                                    </div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">
                                    {user.team_members.length > 0 ? (
                                        <div className="space-y-1">
                                            {user.team_members.map((tm: any, idx: number) => (
                                                <div key={idx} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full inline-block mr-1">
                                                    {tm.teams?.name}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-sm">Takım yok</span>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {new Date(user.created_at).toLocaleDateString('tr-TR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {user.is_admin ? (
                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800">
                                        👑 Admin
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-700">
                                        Kullanıcı
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                    onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                                    disabled={loading === user.id}
                                    className={`${user.is_admin
                                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                        } px-4 py-2 rounded-lg font-medium disabled:opacity-50 transition`}
                                >
                                    {loading === user.id
                                        ? 'İşleniyor...'
                                        : user.is_admin
                                            ? 'Admin Yetkisini Kaldır'
                                            : 'Admin Yap'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
