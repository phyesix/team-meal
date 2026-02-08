'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface HistoryPageProps {
    params: Promise<{ teamId: string }>
}

interface CycleStat {
    id: string
    cycleNumber: number
    isActive: boolean
    startedAt: string
    completedAt: string | null
    totalTurns: number
    completedTurns: number
    restaurants: string[]
    totalRestaurants: number
}

export default function CycleHistoryPage({ params }: HistoryPageProps) {
    const [teamId, setTeamId] = useState<string>('')
    const [cycles, setCycles] = useState<CycleStat[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        params.then((p) => {
            setTeamId(p.teamId)
            loadCycles(p.teamId)
        })
    }, [params])

    const loadCycles = async (tid: string) => {
        try {
            const response = await fetch(`/api/cycles?teamId=${tid}`)

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to load cycles')
            }

            const data = await response.json()
            setCycles(data.cycles)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-gray-600">Yükleniyor...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-gray-600 mb-4">{error}</p>
                <Link
                    href={`/teams/${teamId}`}
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                    ← Takıma Dön
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <Link href={`/teams/${teamId}`} className="text-indigo-600 hover:text-indigo-700 font-medium">
                    ← Takıma Dön
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">📋 Döngü Geçmişi</h1>
                <p className="text-gray-600">Tüm döngülerin özeti ve detayları</p>
            </div>

            {cycles.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <div className="text-6xl mb-4">🔄</div>
                    <p className="text-gray-600">Henüz döngü başlatılmamış</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {cycles.map((cycle) => (
                        <Link
                            key={cycle.id}
                            href={`/teams/${teamId}/summary?cycleId=${cycle.id}`}
                            className="block bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden"
                        >
                            <div className={`p-6 ${cycle.isActive ? 'border-l-4 border-green-500' : ''}`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl font-bold text-indigo-600">
                                            #{cycle.cycleNumber}
                                        </span>
                                        {cycle.isActive ? (
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                                🟢 Aktif
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                                                ✅ Tamamlandı
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-right text-sm text-gray-500">
                                        {cycle.startedAt && (
                                            <p>Başlangıç: {new Date(cycle.startedAt).toLocaleDateString('tr-TR')}</p>
                                        )}
                                        {cycle.completedAt && (
                                            <p>Bitiş: {new Date(cycle.completedAt).toLocaleDateString('tr-TR')}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                                        <span>İlerleme</span>
                                        <span>{cycle.completedTurns} / {cycle.totalTurns}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all ${cycle.isActive ? 'bg-green-500' : 'bg-indigo-600'}`}
                                            style={{ width: cycle.totalTurns > 0 ? `${(cycle.completedTurns / cycle.totalTurns) * 100}%` : '0%' }}
                                        />
                                    </div>
                                </div>

                                {/* Restaurants Preview */}
                                {cycle.restaurants.length > 0 && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-2">🍽️ Gidilen Mekanlar:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {cycle.restaurants.map((restaurant, index) => (
                                                <span
                                                    key={index}
                                                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm"
                                                >
                                                    {restaurant}
                                                </span>
                                            ))}
                                            {cycle.totalRestaurants > 3 && (
                                                <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-lg text-sm">
                                                    +{cycle.totalRestaurants - 3} daha
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
