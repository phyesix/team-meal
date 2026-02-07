'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Team {
    id: string
    name: string
    max_members: number
    vehicle_capacity: number
    created_at: string
    team_members: Array<{
        user_id: string
        profiles: {
            full_name: string | null
            email: string
        }
    }>
}

export default function TeamManagementClient({ teams }: { teams: Team[] }) {
    const [editingTeam, setEditingTeam] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [editMaxMembers, setEditMaxMembers] = useState(0)
    const [editVehicleCapacity, setEditVehicleCapacity] = useState(4)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const startEdit = (team: Team) => {
        setEditingTeam(team.id)
        setEditName(team.name)
        setEditMaxMembers(team.max_members)
        setEditVehicleCapacity(team.vehicle_capacity)
    }

    const cancelEdit = () => {
        setEditingTeam(null)
    }

    const handleUpdate = async (teamId: string) => {
        setLoading(true)
        try {
            const response = await fetch(`/api/admin/teams/${teamId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: editName,
                    max_members: editMaxMembers,
                    vehicle_capacity: editVehicleCapacity,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                alert(error.error || 'Güncelleme başarısız')
                return
            }

            setEditingTeam(null)
            router.refresh()
        } catch (error) {
            alert('Bir hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (teamId: string, teamName: string) => {
        if (!confirm(`"${teamName}" takımını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
            return
        }

        setLoading(true)
        try {
            const response = await fetch(`/api/admin/teams/${teamId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                const error = await response.json()
                alert(error.error || 'Silme başarısız')
                return
            }

            router.refresh()
        } catch (error) {
            alert('Bir hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {teams.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-md p-12 border border-gray-100 text-center">
                    <p className="text-gray-500 text-lg mb-4">Henüz takım oluşturulmamış</p>
                    <p className="text-gray-400 text-sm">Yeni bir takım oluşturmak için ana sayfaya gidin</p>
                </div>
            ) : (
                teams.map((team) => (
                    <div key={team.id} className="bg-white rounded-2xl shadow-md p-8 border border-gray-100">
                        {editingTeam === team.id ? (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Takım Adı
                                    </label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        placeholder="Takım adını girin"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Maksimum Üye
                                        </label>
                                        <input
                                            type="number"
                                            min="2"
                                            value={editMaxMembers}
                                            onChange={(e) => setEditMaxMembers(parseInt(e.target.value))}
                                            className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Araç Kapasitesi
                                        </label>
                                        <input
                                            type="number"
                                            min="2"
                                            value={editVehicleCapacity}
                                            onChange={(e) => setEditVehicleCapacity(parseInt(e.target.value))}
                                            className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleUpdate(team.id)}
                                        disabled={loading}
                                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white px-6 py-3 rounded-xl font-bold transition shadow-md hover:shadow-lg"
                                    >
                                        💾 Kaydet
                                    </button>
                                    <button
                                        onClick={cancelEdit}
                                        disabled={loading}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold transition"
                                    >
                                        ✕ İptal
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{team.name}</h3>
                                        <p className="text-sm text-gray-500">
                                            📅 Oluşturulma: {new Date(team.created_at).toLocaleDateString('tr-TR')}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => startEdit(team)}
                                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg font-semibold text-sm transition"
                                        >
                                            ✏️ Düzenle
                                        </button>
                                        <button
                                            onClick={() => handleDelete(team.id, team.name)}
                                            className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg font-semibold text-sm transition"
                                        >
                                            🗑️ Sil
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                                        <p className="text-xs text-blue-600 font-semibold mb-1">Üye Sayısı</p>
                                        <p className="text-2xl font-bold text-blue-900">
                                            {team.team_members.length} / {team.max_members}
                                        </p>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                                        <p className="text-xs text-green-600 font-semibold mb-1">Araç Kapasitesi</p>
                                        <p className="text-2xl font-bold text-green-900">{team.vehicle_capacity} kişi</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                                        <p className="text-xs text-purple-600 font-semibold mb-1">Doluluk</p>
                                        <p className="text-2xl font-bold text-purple-900">
                                            %{Math.round((team.team_members.length / team.max_members) * 100)}
                                        </p>
                                    </div>
                                </div>

                                {team.team_members.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-700 mb-3">👥 Üyeler ({team.team_members.length}):</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {team.team_members.map((member: any) => (
                                                <div key={member.user_id} className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                    {member.profiles?.full_name || member.profiles?.email}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )))}
        </div>
    )
}
