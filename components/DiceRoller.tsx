'use client'

import { useState, useEffect } from 'react'

interface DiceRollerProps {
    onRoll: (die1: number, die2: number) => void
    disabled?: boolean
}

export default function DiceRoller({ onRoll, disabled }: DiceRollerProps) {
    const [rolling, setRolling] = useState(false)
    const [die1, setDie1] = useState<number | null>(null)
    const [die2, setDie2] = useState<number | null>(null)

    const rollDice = () => {
        if (disabled || rolling) return

        setRolling(true)
        setDie1(null)
        setDie2(null)

        // Animate rolling
        let count = 0
        const interval = setInterval(() => {
            setDie1(Math.floor(Math.random() * 10) + 1)
            setDie2(Math.floor(Math.random() * 10) + 1)
            count++

            if (count >= 15) {
                clearInterval(interval)
                const finalDie1 = Math.floor(Math.random() * 10) + 1
                const finalDie2 = Math.floor(Math.random() * 10) + 1
                setDie1(finalDie1)
                setDie2(finalDie2)
                setRolling(false)
                onRoll(finalDie1, finalDie2)
            }
        }, 100)
    }

    return (
        <div className="flex flex-col items-center space-y-6">
            <div className="flex gap-6">
                <div className={`w-24 h-24 bg-white border-4 border-indigo-600 rounded-xl flex items-center justify-center text-4xl font-bold shadow-lg transition-transform ${rolling ? 'animate-bounce' : ''}`}>
                    {die1 || '?'}
                </div>
                <div className={`w-24 h-24 bg-white border-4 border-indigo-600 rounded-xl flex items-center justify-center text-4xl font-bold shadow-lg transition-transform ${rolling ? 'animate-bounce' : ''}`}>
                    {die2 || '?'}
                </div>
            </div>

            {die1 && die2 && !rolling && (
                <div className="text-center">
                    <p className="text-gray-600 text-sm">Toplam</p>
                    <p className="text-5xl font-bold text-indigo-600">{die1 + die2}</p>
                </div>
            )}

            <button
                onClick={rollDice}
                disabled={disabled || rolling}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg font-bold text-lg transition transform hover:scale-105"
            >
                {rolling ? 'Zarlar Atılıyor...' : disabled ? 'Zar Atıldı' : '🎲 Zar At'}
            </button>
        </div>
    )
}
