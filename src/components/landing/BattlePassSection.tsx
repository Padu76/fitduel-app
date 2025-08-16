'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

interface Reward {
  tier: number
  icon: string
  name: string
  premium: boolean
}

const rewards: Reward[] = [
  { tier: 1, icon: '💪', name: 'Avatar Base', premium: false },
  { tier: 5, icon: '🎯', name: 'Emote Victory', premium: false },
  { tier: 10, icon: '🔥', name: 'Skin Fire', premium: true },
  { tier: 15, icon: '⚡', name: 'Boost XP', premium: false },
  { tier: 20, icon: '🏆', name: 'Title Champion', premium: false },
  { tier: 25, icon: '👑', name: 'Crown Effect', premium: true },
  { tier: 30, icon: '💎', name: '1000 Coins', premium: false },
  { tier: 50, icon: '🌟', name: 'Legendary Skin', premium: true }
]

export default function BattlePassSection() {
  return (
    <section className="py-24 px-4 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <Image
          src="https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&h=600&fit=crop"
          alt="Battle Pass Background"
          fill
          className="object-cover"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-5xl font-black text-center mb-8 uppercase text-white"
        >
          Battle Pass
        </motion.h2>

        {/* Season Header */}
        <SeasonHeader />

        {/* Rewards Track */}
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-orange-500 scrollbar-track-gray-900">
          {rewards.map((reward, index) => (
            <RewardItem key={index} reward={reward} index={index} />
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          height: 8px;
        }
        .scrollbar-thumb-orange-500::-webkit-scrollbar-thumb {
          background-color: #ff6b35;
          border-radius: 9999px;
        }
        .scrollbar-track-gray-900::-webkit-scrollbar-track {
          background-color: #111827;
          border-radius: 9999px;
        }
      `}</style>
    </section>
  )
}

// Sub-component for season header
function SeasonHeader() {
  const timeBlocks = [
    { value: 28, label: 'Giorni' },
    { value: 14, label: 'Ore' },
    { value: 32, label: 'Min' }
  ]

  return (
    <div className="flex flex-wrap justify-between items-center mb-12 gap-6">
      <div className="bg-gradient-to-r from-green-400 to-blue-500 px-8 py-3 rounded-full font-black text-xl text-black">
        SEASON 1 - ORIGINS
      </div>
      
      <div className="flex gap-4">
        {timeBlocks.map((time, i) => (
          <div key={i} className="bg-gray-900 border border-green-400/30 rounded-xl p-4 min-w-[80px] text-center">
            <div className="text-3xl font-black text-blue-500">{time.value}</div>
            <div className="text-xs text-gray-400 uppercase">{time.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Sub-component for reward item
function RewardItem({ reward, index }: { reward: Reward; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      className={`
        min-w-[140px] p-6 rounded-2xl text-center relative
        ${reward.premium 
          ? 'bg-gradient-to-br from-green-400/30 to-blue-500/20 border-2 border-green-400' 
          : 'bg-gray-900 border border-gray-800'
        }
      `}
    >
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-400 to-blue-500 px-3 py-1 rounded-full text-xs font-bold text-black">
        LV {reward.tier}
      </div>
      <div className="text-4xl mb-3 mt-2">{reward.icon}</div>
      <div className="text-sm font-medium text-white">{reward.name}</div>
      {reward.premium && (
        <div className="absolute top-2 right-2 text-xs bg-green-400 px-2 py-1 rounded-full text-black font-bold">
          PRO
        </div>
      )}
    </motion.div>
  )
}