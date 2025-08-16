'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

interface GameMode {
  icon: string
  title: string
  players: string
  description: string
  bgImage: string
}

const gameModes: GameMode[] = [
  {
    icon: '⚡',
    title: 'SFIDA LAMPO',
    players: '1 VS 1 • 30 SECONDI',
    description: 'Sfida istantanea contro un amico. Chi fa più ripetizioni in 30 secondi vince!',
    bgImage: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=400&h=500&fit=crop'
  },
  {
    icon: '👥',
    title: 'TEAM BATTLE',
    players: '5 VS 5 • 5 MINUTI',
    description: 'Crea il tuo team e domina. Punti doppi per le vittorie di squadra!',
    bgImage: 'https://images.unsplash.com/photo-1552674605-db6894100b4f?w=400&h=500&fit=crop'
  },
  {
    icon: '🏆',
    title: 'TORNEO DAILY',
    players: '100 PLAYERS • TUTTO IL GIORNO',
    description: 'Accumula punti durante il giorno. Top 3 vincono premi esclusivi!',
    bgImage: 'https://images.unsplash.com/photo-1571019613454-516006a1aa2?w=400&h=500&fit=crop'
  },
  {
    icon: '🎯',
    title: 'MISSIONI SOLO',
    players: 'SINGLE PLAYER • QUANDO VUOI',
    description: 'Completa missioni giornaliere e sblocca rewards. Nuovo contenuto ogni giorno!',
    bgImage: 'https://images.unsplash.com/photo-1581009146145-a5de890ff157?w=400&h=500&fit=crop'
  }
]

export default function GameModesSection() {
  return (
    <section className="py-24 px-4 bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-5xl font-black text-center mb-16 uppercase text-white"
        >
          Modalità di Gioco
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {gameModes.map((mode, index) => (
            <GameModeCard key={index} mode={mode} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

// Sub-component for individual game mode card
function GameModeCard({ mode, index }: { mode: GameMode; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -10, scale: 1.02 }}
      className="relative group cursor-pointer"
    >
      <div className="relative h-80 rounded-2xl overflow-hidden">
        {/* Background Image */}
        <Image
          src={mode.bgImage}
          alt={mode.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        {/* Content */}
        <div className="absolute inset-0 p-6 flex flex-col justify-end">
          <div className="text-5xl mb-4">{mode.icon}</div>
          <h3 className="text-2xl font-black text-green-400 mb-2">
            {mode.title}
          </h3>
          <p className="text-xs text-blue-400 font-bold mb-3">
            {mode.players}
          </p>
          <p className="text-sm text-gray-300">
            {mode.description}
          </p>
        </div>

        {/* Hover Border Effect */}
        <div className="absolute inset-0 border-2 border-green-400 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </motion.div>
  )
}