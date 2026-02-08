'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SummaryPageProps {
    params: Promise<{ teamId: string }>
    searchParams: Promise<{ cycleId?: string }>
}

interface CycleSummary {
    cycle: {
        id: string
        cycleNumber: number
        teamName: string
        startedAt: string
        completedAt: string
    }
    restaurants: Array<{
        name: string
        date: string
        host: string
    }>
    driverStats: Array<{
        name: string
        count: number
    }>
    totalMeals: number
    totalDrives: number
}

export default function CycleSummaryPage({ params, searchParams }: SummaryPageProps) {
    const [teamId, setTeamId] = useState<string>('')
    const [cycleId, setCycleId] = useState<string | undefined>()
    const [summary, setSummary] = useState<CycleSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        Promise.all([params, searchParams]).then(([p, sp]) => {
            setTeamId(p.teamId)
            setCycleId(sp.cycleId)
            loadSummary(p.teamId, sp.cycleId)
        })
    }, [params, searchParams])

    const loadSummary = async (tid: string, cid?: string) => {
        try {
            const url = cid
                ? `/api/cycle-summary?cycleId=${cid}`
                : `/api/cycle-summary?teamId=${tid}`
            const response = await fetch(url)

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to load summary')
            }

            const data = await response.json()
            setSummary(data)
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
                <div className="text-6xl mb-4">📊</div>
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

    if (!summary) {
        return null
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <Link href={`/teams/${teamId}`} className="text-indigo-600 hover:text-indigo-700 font-medium">
                    ← Takıma Dön
                </Link>
            </div>

            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 mb-8 text-white text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h1 className="text-3xl font-bold mb-2">Döngü Tamamlandı!</h1>
                <p className="text-green-100 text-lg">
                    {summary.cycle.teamName} - Döngü #{summary.cycle.cycleNumber}
                </p>
                {summary.cycle.completedAt && (
                    <p className="text-green-200 text-sm mt-2">
                        {new Date(summary.cycle.completedAt).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white rounded-xl shadow-md p-6 text-center">
                    <div className="text-4xl font-bold text-indigo-600">{summary.totalMeals}</div>
                    <div className="text-gray-600 mt-1">Toplam Yemek</div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 text-center">
                    <div className="text-4xl font-bold text-purple-600">{summary.totalDrives}</div>
                    <div className="text-gray-600 mt-1">Toplam Sürüş</div>
                </div>
            </div>

            {/* Restaurants Visited */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    🍽️ Gidilen Mekanlar
                </h2>
                <div className="space-y-3">
                    {summary.restaurants.map((restaurant, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-bold text-gray-300">#{index + 1}</span>
                                <div>
                                    <p className="font-semibold text-gray-900">{restaurant.name}</p>
                                    <p className="text-sm text-gray-600">
                                        👤 {restaurant.host}
                                    </p>
                                </div>
                            </div>
                            {restaurant.date && (
                                <span className="text-sm text-gray-500">
                                    📅 {new Date(restaurant.date).toLocaleDateString('tr-TR')}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Driver Statistics */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    🚗 Sürücü İstatistikleri
                </h2>
                <div className="space-y-3">
                    {summary.driverStats.map((driver, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🚗'}
                                </span>
                                <span className="font-semibold text-gray-900">{driver.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-indigo-600">{driver.count}</span>
                                <span className="text-sm text-gray-500">sürüş</span>
                            </div>
                        </div>
                    ))}
                    {summary.driverStats.length === 0 && (
                        <p className="text-gray-500 text-center py-4">Sürüş kaydı bulunamadı</p>
                    )}
                </div>
            </div>

            {/* Action Button */}
            <div className="text-center">
                <Link
                    href={`/teams/${teamId}/rotation`}
                    className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition"
                >
                    Yeni Döngüyü Görüntüle →
                </Link>
            </div>
        </div>
    )
}
