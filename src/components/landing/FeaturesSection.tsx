'use client'

import { motion } from 'framer-motion'

interface Feature {
  icon: string
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: '⚡',
    title: 'Sfide Veloci',
    description: '30 secondi per vincere. Niente allenamenti lunghi. Solo azione pura.'
  },
  {
    icon: '🤖',
    title: 'AI Tracking',
    description: 'La nostra AI conta le tue ripetizioni e valuta la forma. Zero trucchi.'
  },
  {
    icon: '🏆',
    title: 'Rewards Reali',
    description: 'Vinci skin, badge, titoli esclusivi. Mostra a tutti chi è il boss.'
  },
  {
    icon: '👥',
    title: 'Social Competition',
    description: 'Sfida amici, crea team, domina le classifiche. Il fitness è più divertente insieme.'
  },
  {
    icon: '📱',
    title: 'Cross-Platform',
    description: 'Gioca su telefono, tablet o PC. I tuoi progressi ti seguono ovunque.'
  },
  {
    icon: '🎮',
    title: 'Gaming Experience',
    description: 'Interfaccia gaming, effetti epici, progression system. Il fitness diventa un gioco.'
  }
]

export default function FeaturesSection() {
  return (
    <section className="py-24 px-4 bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-5xl font-black text-center mb-16 uppercase text-white"
        >
          Perché FitDuel?
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

// Sub-component for individual feature card
function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="text-center group"
    >
      <motion.div
        whileHover={{ rotate: 360, scale: 1.1 }}
        transition={{ duration: 0.5 }}
        className="w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-6 group-hover:shadow-2xl group-hover:shadow-green-400/50 transition-shadow duration-300"
      >
        {feature.icon}
      </motion.div>
      <h3 className="text-2xl font-black mb-4 text-white">{feature.title}</h3>
      <p className="text-gray-400 leading-relaxed">{feature.description}</p>
    </motion.div>
  )
}