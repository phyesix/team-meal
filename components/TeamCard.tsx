'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface TeamCardProps {
    team: {
        id: string
        name: string
        max_members: number
        vehicle_capacity: number
    }
    memberCount: number
    isMember: boolean
    userId: string
}

export default function TeamCard({ team, memberCount, isMember, userId }: TeamCardProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleJoinTeam = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/teams/${team.id}/join`, {
                method: 'POST',
            })

            if (!response.ok) {
                const error = await response.json()
                alert(error.error || 'Takıma katılırken hata oluştu')
                return
            }

            router.refresh()
        } catch (error) {
            alert('Bir hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    const isFull = memberCount >= team.max_members

    return (
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
                {isMember && (
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                        Üyesiniz
                    </span>
                )}
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Üye Sayısı:</span>
                    <span className="font-semibold text-gray-900">
                        {memberCount} / {team.max_members}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Araç Kapasitesi:</span>
                    <span className="font-semibold text-gray-900">{team.vehicle_capacity} kişi</span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${(memberCount / team.max_members) * 100}%` }}
                />
            </div>

            <div className="flex gap-2">
                {isMember ? (
                    <Link
                        href={`/teams/${team.id}`}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-center px-4 py-2 rounded-lg font-semibold transition"
                    >
                        Takımı Görüntüle
                    </Link>
                ) : (
                    <button
                        onClick={handleJoinTeam}
                        disabled={loading || isFull}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition"
                    >
                        {loading ? 'Katılınıyor...' : isFull ? 'Takım Dolu' : 'Takıma Katıl'}
                    </button>
                )}
            </div>
        </div>
    )
}
