'use client'

import { useState } from 'react'

interface TeamMember {
    id: string
    user_id: string
    has_car: boolean
    joined_at: string
    profiles: {
        full_name: string | null
        email: string
    } | null
}

interface TeamMembersListProps {
    members: TeamMember[]
    currentUserId: string
    isAdmin: boolean
}

export default function TeamMembersList({ members: initialMembers, currentUserId, isAdmin }: TeamMembersListProps) {
    const [members, setMembers] = useState(initialMembers)
    const [updating, setUpdating] = useState<string | null>(null)

    const handleCarToggle = async (memberId: string, currentValue: boolean) => {
        setUpdating(memberId)
        try {
            const response = await fetch(`/api/team-members/${memberId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ has_car: !currentValue }),
            })

            if (response.ok) {
                setMembers(members.map(m =>
                    m.id === memberId ? { ...m, has_car: !currentValue } : m
                ))
            }
        } catch (error) {
            console.error('Failed to update car status:', error)
        } finally {
            setUpdating(null)
        }
    }

    return (
        <div className="space-y-3">
            {members.map((member) => {
                const canEdit = isAdmin || member.user_id === currentUserId
                return (
                    <div key={member.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div>
                                <p className="font-semibold text-gray-900">
                                    {member.profiles?.full_name || member.profiles?.email}
                                </p>
                                <p className="text-sm text-gray-600">{member.profiles?.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <label className={`flex items-center gap-2 ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                <span className="text-sm text-gray-600">🚗 Araba var</span>
                                <button
                                    type="button"
                                    disabled={!canEdit || updating === member.id}
                                    onClick={() => canEdit && handleCarToggle(member.id, member.has_car)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${member.has_car ? 'bg-green-600' : 'bg-gray-300'
                                        } ${!canEdit ? 'opacity-50' : ''}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${member.has_car ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                    {updating === member.id && (
                                        <span className="absolute inset-0 flex items-center justify-center">
                                            <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
                                        </span>
                                    )}
                                </button>
                            </label>
                            <span className="text-sm text-gray-500">
                                {new Date(member.joined_at).toLocaleDateString('tr-TR')}
                            </span>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
