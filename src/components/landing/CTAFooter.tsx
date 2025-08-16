'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'

export function CTASection() {
  const router = useRouter()

  return (
    <section className="py-32 px-4 relative">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=1920&h=800&fit=crop"
          alt="CTA Background"
          fill
          className="object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/50" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative z-10 max-w-4xl mx-auto text-center"
      >
        <h2 className="text-5xl md:text-7xl font-black mb-6 uppercase bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          Pronto per la battaglia?
        </h2>
        <p className="text-xl md:text-2xl text-gray-300 mb-12">
          Unisciti a migliaia di giocatori. Prima vittoria garantita in 60 secondi.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/auth')}
          className="relative group overflow-hidden bg-gradient-to-r from-green-400 to-blue-500 text-black px-12 py-6 rounded-full text-2xl font-black uppercase tracking-wider shadow-2xl transition-all duration-300"
        >
          <span className="relative z-10">INIZIA GRATIS</span>
          <div className="absolute inset-0 bg-gradient-to-r from-green-300 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </motion.button>
      </motion.div>
    </section>
  )
}

export function FooterSection() {
  const links = ['Privacy', 'Termini', 'Supporto', 'Discord', 'Twitter']
  
  return (
    <footer className="py-12 px-4 bg-black border-t border-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-center gap-8 mb-8">
          {links.map((link) => (
            <a
              key={link}
              href="#"
              className="text-gray-400 hover:text-green-400 transition-colors"
            >
              {link}
            </a>
          ))}
        </div>
        <div className="text-center text-gray-500 text-sm">
          © 2024 FitDuel. Game on, fit on.
        </div>
      </div>
    </footer>
  )
}