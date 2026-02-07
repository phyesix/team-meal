'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DiceRoller from '@/components/DiceRoller'

interface DiceRollPageProps {
    params: Promise<{ teamId: string }>
}

export default function DiceRollPage({ params }: DiceRollPageProps) {
    const [teamId, setTeamId] = useState<string>('')
    const [hasRolled, setHasRolled] = useState(false)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [rolledValues, setRolledValues] = useState<{ die1: number; die2: number } | null>(null)
    const [diceRolled, setDiceRolled] = useState(false)
    const router = useRouter()

    useEffect(() => {
        params.then(p => {
            setTeamId(p.teamId)
            checkIfUserRolled(p.teamId)
        })
    }, [params])

    const checkIfUserRolled = async (tid: string) => {
        try {
            const response = await fetch(`/api/dice-rolls?teamId=${tid}`)
            const data = await response.json()

            if (data.userRoll) {
                setHasRolled(true)
                setRolledValues({ die1: data.userRoll.die1, die2: data.userRoll.die2 })
            }
        } catch (err) {
            console.error('Error checking dice roll:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleRoll = async (die1: number, die2: number) => {
        setRolledValues({ die1, die2 })
        setDiceRolled(true)
    }

    const handleSubmit = async () => {
        if (!rolledValues) return

        setSubmitting(true)
        setError(null)

        try {
            const response = await fetch('/api/dice-rolls', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    teamId,
                    die1: rolledValues.die1,
                    die2: rolledValues.die2,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Zar kaydedilemedi')
            }

            setHasRolled(true)
            router.refresh()
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

    return (
        <div>
            <div className="mb-6">
                <Link href={`/teams/${teamId}`} className="text-indigo-600 hover:text-indigo-700 font-medium">
                    ← Takıma Dön
                </Link>
            </div>

            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Zar Atma</h1>
                    <p className="text-gray-600 mb-8 text-center">
                        Rotasyon sıranızı belirlemek için 2 adet D10 zar atın
                    </p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    {hasRolled ? (
                        <div className="text-center space-y-6">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                                <p className="text-green-800 font-semibold mb-4">✅ Zarlarınızı attınız!</p>
                                <div className="flex justify-center gap-6 mb-4">
                                    <div className="w-20 h-20 bg-white border-4 border-green-600 rounded-xl flex items-center justify-center text-3xl font-bold">
                                        {rolledValues?.die1}
                                    </div>
                                    <div className="w-20 h-20 bg-white border-4 border-green-600 rounded-xl flex items-center justify-center text-3xl font-bold">
                                        {rolledValues?.die2}
                                    </div>
                                </div>
                                <p className="text-gray-700">
                                    Toplam: <span className="text-4xl font-bold text-green-600">{(rolledValues?.die1 || 0) + (rolledValues?.die2 || 0)}</span>
                                </p>
                            </div>
                            <Link
                                href={`/teams/${teamId}`}
                                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                            >
                                Takıma Dön
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <DiceRoller onRoll={handleRoll} disabled={diceRolled} />

                            {rolledValues && !hasRolled && (
                                <div className="text-center">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold transition"
                                    >
                                        {submitting ? 'Kaydediliyor...' : 'Zarları Kaydet'}
                                    </button>
                                    <p className="text-sm text-gray-500 mt-2">
                                        ⚠️ Zarları kaydettikten sonra değiştiremezsiniz
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
