'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface RotationPageProps {
    params: Promise<{ teamId: string }>
}

export default function RotationPage({ params }: RotationPageProps) {
    const [teamId, setTeamId] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [team, setTeam] = useState<any>(null)
    const [mealTurns, setMealTurns] = useState<any[]>([])
    const [currentTurn, setCurrentTurn] = useState<any>(null)
    const [isCurrentUser, setIsCurrentUser] = useState(false)
    const [restaurantName, setRestaurantName] = useState('')
    const [mealDate, setMealDate] = useState('')
    const [selectedDrivers, setSelectedDrivers] = useState<string[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        params.then(p => {
            setTeamId(p.teamId)
            loadRotationData(p.teamId)
        })
    }, [params])

    const loadRotationData = async (tid: string) => {
        try {
            const response = await fetch(`/api/meal-turns?teamId=${tid}`)
            const data = await response.json()

            setTeam(data.team)
            setMealTurns(data.mealTurns || [])
            setCurrentTurn(data.currentTurn)
            setIsCurrentUser(data.isCurrentUser)

            if (data.currentTurn) {
                setMealDate(new Date().toISOString().split('T')[0])
            }
        } catch (err) {
            console.error('Error loading rotation data:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleDriverToggle = (userId: string) => {
        if (selectedDrivers.includes(userId)) {
            setSelectedDrivers(selectedDrivers.filter(id => id !== userId))
        } else {
            setSelectedDrivers([...selectedDrivers, userId])
        }
    }

    const handleSubmit = async () => {
        if (!restaurantName.trim()) {
            setError('Restoran adı gerekli')
            return
        }

        if (selectedDrivers.length === 0) {
            setError('En az bir sürücü seçmelisiniz')
            return
        }

        setSubmitting(true)
        setError(null)

        try {
            const response = await fetch('/api/meal-turns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    teamId,
                    turnId: currentTurn.id,
                    restaurantName,
                    mealDate,
                    drivers: selectedDrivers,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Kayıt başarısız')
            }

            router.refresh()
            loadRotationData(teamId)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-gray-600">Yükleniyor...</div>
            </div>
        )
    }

    if (!mealTurns || mealTurns.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Henüz rotasyon başlamadı. Önce tüm üyelerin zar atması gerekiyor.</p>
                <Link
                    href={`/teams/${teamId}`}
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                    ← Takıma Dön
                </Link>
            </div>
        )
    }

    const completedTurns = mealTurns.filter(t => t.is_completed)
    const progress = (completedTurns.length / mealTurns.length) * 100

    return (
        <div>
            <div className="mb-6">
                <Link href={`/teams/${teamId}`} className="text-indigo-600 hover:text-indigo-700 font-medium">
                    ← Takıma Dön
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Yemek Rotasyonu</h1>
                <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>İlerleme</span>
                        <span>{completedTurns.length} / {mealTurns.length} tamamlandı</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                            className="bg-green-600 h-3 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {currentTurn && isCurrentUser && !currentTurn.is_completed && (
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-6 mb-6">
                    <h2 className="text-2xl font-bold text-indigo-900 mb-4">🎉 Sıra Sizde!</h2>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Restoran Adı
                                </label>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            // Get user's location
                                            if (navigator.geolocation) {
                                                navigator.geolocation.getCurrentPosition(
                                                    async (position) => {
                                                        const { latitude, longitude } = position.coords
                                                        const res = await fetch(
                                                            `/api/restaurant-suggestion?lat=${latitude}&lon=${longitude}&radius=3000`
                                                        )
                                                        const data = await res.json()
                                                        if (data.name) {
                                                            const restaurantText = data.cuisine && data.cuisine !== 'Genel'
                                                                ? `${data.name} (${data.cuisine})`
                                                                : data.name
                                                            setRestaurantName(restaurantText)
                                                        }
                                                    },
                                                    async (error) => {
                                                        // If location denied, use default Istanbul coordinates
                                                        console.log('Location access denied, using default location')
                                                        const res = await fetch('/api/restaurant-suggestion')
                                                        const data = await res.json()
                                                        if (data.name) {
                                                            const restaurantText = data.cuisine && data.cuisine !== 'Genel'
                                                                ? `${data.name} (${data.cuisine})`
                                                                : data.name
                                                            setRestaurantName(restaurantText)
                                                        }
                                                    }
                                                )
                                            } else {
                                                // Browser doesn't support geolocation
                                                const res = await fetch('/api/restaurant-suggestion')
                                                const data = await res.json()
                                                if (data.name) {
                                                    const restaurantText = data.cuisine && data.cuisine !== 'Genel'
                                                        ? `${data.name} (${data.cuisine})`
                                                        : data.name
                                                    setRestaurantName(restaurantText)
                                                }
                                            }
                                        } catch (err) {
                                            console.error('Failed to get suggestion:', err)
                                        }
                                    }}
                                    className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded-lg font-semibold transition"
                                >
                                    📍 Yakındaki Restoranlar
                                </button>
                            </div>
                            <input
                                type="text"
                                value={restaurantName}
                                onChange={(e) => setRestaurantName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                placeholder="Gidilecek restoran..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Yemek Tarihi
                            </label>
                            <input
                                type="date"
                                value={mealDate}
                                onChange={(e) => setMealDate(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sürücüler (Araç Kapasitesi: {team?.vehicle_capacity} kişi)
                            </label>
                            <div className="space-y-2">
                                {mealTurns.map((turn: any) => (
                                    <label
                                        key={turn.user_id}
                                        className="flex items-center p-3 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedDrivers.includes(turn.user_id)}
                                            onChange={() => handleDriverToggle(turn.user_id)}
                                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                        />
                                        <span className="ml-3 text-gray-900">
                                            {turn.profiles?.full_name || turn.profiles?.email}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                                Seçilen sürücü sayısı: {selectedDrivers.length}
                            </p>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition"
                        >
                            {submitting ? 'Kaydediliyor...' : 'Tamamla'}
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Rotasyon Sırası</h2>
                <div className="space-y-3">
                    {mealTurns.map((turn: any) => (
                        <div
                            key={turn.id}
                            className={`p-4 rounded-lg border-2 ${turn.is_completed
                                ? 'bg-green-50 border-green-200'
                                : turn.id === currentTurn?.id
                                    ? 'bg-indigo-50 border-indigo-300'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl font-bold text-gray-400">#{turn.turn_order}</span>
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {turn.profiles?.full_name || turn.profiles?.email}
                                        </p>
                                        {turn.restaurant_name && (
                                            <p className="text-sm text-gray-600">🍽️ {turn.restaurant_name}</p>
                                        )}
                                        {turn.meal_date && (
                                            <p className="text-sm text-gray-500">
                                                📅 {new Date(turn.meal_date).toLocaleDateString('tr-TR')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {turn.is_completed ? (
                                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                        ✓ Tamamlandı
                                    </span>
                                ) : turn.id === currentTurn?.id ? (
                                    <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                        ⏳ Sırada
                                    </span>
                                ) : (
                                    <span className="bg-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
                                        Bekliyor
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
