'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useMousePosition, useFloatingAnimation } from '@/hooks/useParallaxEffects'

export function CTASection() {
  const router = useRouter()
  const mousePosition = useMousePosition()
  const sectionRef = useRef<HTMLDivElement>(null)
  const [isButtonHovered, setIsButtonHovered] = useState(false)
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  })
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])
  const textScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.9])
  
  const floatingRef1 = useFloatingAnimation(4, 30)
  const floatingRef2 = useFloatingAnimation(5, 40)

  return (
    <section ref={sectionRef} className="py-32 px-4 relative overflow-hidden">
      {/* Parallax Background Image */}
      <motion.div 
        className="absolute inset-0"
        style={{ y: backgroundY }}
      >
        <Image
          src="https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=1920&h=800&fit=crop"
          alt="CTA Background"
          fill
          className="object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/50" />
      </motion.div>

      {/* Animated grid overlay */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 136, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 136, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
          transform: `perspective(1000px) rotateX(60deg) translateY(${mousePosition.normalizedY * 50}px)`,
        }}
      />

      {/* Floating orbs */}
      <div className="absolute inset-0">
        <div 
          ref={floatingRef1}
          className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-green-400/30 to-blue-500/30 rounded-full blur-3xl"
        />
        <div 
          ref={floatingRef2}
          className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur-3xl"
        />
      </div>

      {/* Spotlight effect */}
      <div 
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(0, 255, 136, 0.2), transparent 40%)`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative z-10 max-w-4xl mx-auto text-center"
        style={{ scale: textScale }}
      >
        {/* Main heading with 3D effect */}
        <motion.h2 
          className="text-5xl md:text-7xl font-black mb-6 uppercase"
          style={{
            transform: `perspective(1000px) rotateX(${mousePosition.normalizedY * -5}deg) rotateY(${mousePosition.normalizedX * 5}deg)`,
            textShadow: `${mousePosition.normalizedX * 20}px ${mousePosition.normalizedY * 20}px 40px rgba(0, 255, 136, 0.3)`,
          }}
        >
          <motion.span
            className="bg-gradient-to-r from-green-400 via-white to-blue-500 bg-clip-text text-transparent"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 5, repeat: Infinity }}
            style={{
              backgroundSize: '200% 100%',
            }}
          >
            Pronto per la battaglia?
          </motion.span>
        </motion.h2>

        {/* Subtitle with typing effect */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-xl md:text-2xl text-gray-300 mb-12"
        >
          Unisciti a migliaia di giocatori. 
          <motion.span
            className="text-green-400 font-bold"
            animate={{
              opacity: [0, 1, 1, 0],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {' '}Prima vittoria garantita in 60 secondi.
          </motion.span>
        </motion.p>

        {/* Epic CTA Button */}
        <div className="relative inline-block">
          {/* Background pulse effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-full blur-xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Main button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={() => setIsButtonHovered(true)}
            onMouseLeave={() => setIsButtonHovered(false)}
            onClick={() => router.push('/auth')}
            className="relative group overflow-hidden bg-gradient-to-r from-green-400 to-blue-500 text-black px-12 py-6 rounded-full text-2xl font-black uppercase tracking-wider shadow-2xl transition-all duration-300"
            style={{
              transform: `perspective(1000px) rotateX(${mousePosition.normalizedY * -10}deg) rotateY(${mousePosition.normalizedX * 10}deg)`,
              boxShadow: isButtonHovered 
                ? '0 30px 60px rgba(0, 255, 136, 0.5), 0 0 100px rgba(0, 136, 255, 0.3)'
                : '0 20px 40px rgba(0, 0, 0, 0.3)',
            }}
          >
            <span className="relative z-10">INIZIA GRATIS</span>
            
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 opacity-30"
              animate={isButtonHovered ? {
                backgroundPosition: ['-200% 0%', '200% 0%'],
              } : {}}
              transition={{ duration: 1, repeat: Infinity }}
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)',
                backgroundSize: '200% 100%',
              }}
            />

            {/* Lightning effect on hover */}
            {isButtonHovered && (
              <motion.div
                className="absolute inset-0"
                animate={{
                  opacity: [0, 1, 0],
                }}
                transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 0.5 }}
              >
                <svg className="absolute inset-0 w-full h-full">
                  <motion.path
                    d="M 0 25 L 20 25 L 30 10 L 35 30 L 45 20 L 60 20 L 70 35 L 80 15 L 90 25 L 100 25"
                    stroke="rgba(255, 255, 255, 0.8)"
                    strokeWidth="2"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </svg>
              </motion.div>
            )}
          </motion.button>

          {/* Orbiting particles */}
          {isButtonHovered && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white rounded-full"
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 0.25,
                  }}
                  style={{
                    left: '50%',
                    top: '50%',
                    transformOrigin: '0 0',
                    transform: `rotate(${i * 45}deg) translateX(100px)`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Stats preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-8 mt-20 max-w-xl mx-auto"
        >
          {[
            { number: '10K+', label: 'Giocatori Attivi' },
            { number: '500K+', label: 'Sfide Completate' },
            { number: '4.9★', label: 'Rating App' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.1, y: -5 }}
              className="text-center"
            >
              <motion.div 
                className="text-3xl font-black bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent"
                animate={{
                  textShadow: [
                    '0 0 20px rgba(0, 255, 136, 0)',
                    '0 0 20px rgba(0, 255, 136, 0.5)',
                    '0 0 20px rgba(0, 255, 136, 0)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
              >
                {stat.number}
              </motion.div>
              <div className="text-sm text-gray-400 mt-2">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}

export function FooterSection() {
  const mousePosition = useMousePosition()
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)
  
  const links = ['Privacy', 'Termini', 'Supporto', 'Discord', 'Twitter']
  const socialIcons = ['📱', '🎮', '💬', '🐦', '📧']
  
  return (
    <footer className="py-12 px-4 bg-black border-t border-gray-900 relative overflow-hidden">
      {/* Animated border gradient */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(0, 255, 136, 0.5) ${mousePosition.normalizedX * 100}%, transparent)`,
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Social Links */}
        <motion.div 
          className="flex flex-wrap justify-center gap-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {links.map((link, index) => (
            <motion.a
              key={link}
              href="#"
              onMouseEnter={() => setHoveredLink(link)}
              onMouseLeave={() => setHoveredLink(null)}
              whileHover={{ scale: 1.1, y: -2 }}
              className="relative text-gray-400 hover:text-green-400 transition-colors font-medium"
            >
              {/* Icon on hover */}
              <motion.span
                className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-2xl"
                initial={{ opacity: 0, y: 10 }}
                animate={hoveredLink === link ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              >
                {socialIcons[index]}
              </motion.span>
              
              {link}
              
              {/* Underline animation */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-green-400 to-blue-500"
                initial={{ scaleX: 0 }}
                animate={hoveredLink === link ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.a>
          ))}
        </motion.div>

        {/* Logo and Copyright */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {/* Animated logo */}
          <motion.div
            className="inline-block mb-4"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-3xl font-black bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              FitDuel
            </div>
          </motion.div>
          
          {/* Copyright with typing effect */}
          <motion.div className="text-gray-500 text-sm">
            © 2024 FitDuel. 
            <motion.span
              className="ml-2 text-green-400"
              animate={{
                opacity: [0, 1, 1, 0],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Game on, fit on.
            </motion.span>
          </motion.div>
        </motion.div>

        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute bottom-0 left-1/4 w-64 h-64 bg-green-400/5 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </div>
      </div>
    </footer>
  )
}