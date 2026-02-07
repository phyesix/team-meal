'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateTeamPage() {
    const [name, setName] = useState('')
    const [maxMembers, setMaxMembers] = useState(5)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const response = await fetch('/api/teams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    max_members: maxMembers,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Takım oluşturulurken hata oluştu')
            }

            router.push('/teams')
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <Link href="/teams" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    ← Takımlara Dön
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Yeni Takım Oluştur</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            Takım Adı
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            placeholder="Örn: Mühendislik Takımı"
                        />
                    </div>

                    <div>
                        <label htmlFor="maxMembers" className="block text-sm font-medium text-gray-700 mb-2">
                            Maksimum Üye Sayısı
                        </label>
                        <input
                            id="maxMembers"
                            type="number"
                            min="2"
                            max="50"
                            value={maxMembers}
                            onChange={(e) => setMaxMembers(parseInt(e.target.value))}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            Takımda kaç kişinin olacağını belirleyin (2-50 arası)
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 rounded-lg font-semibold transition"
                        >
                            {loading ? 'Oluşturuluyor...' : 'Takımı Oluştur'}
                        </button>
                        <Link
                            href="/teams"
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold text-center transition"
                        >
                            İptal
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
