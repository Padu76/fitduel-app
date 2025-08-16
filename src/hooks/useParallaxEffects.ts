'use client'

import { useEffect, useRef, useState } from 'react'

interface MousePosition {
  x: number
  y: number
  normalizedX: number // -1 to 1
  normalizedY: number // -1 to 1
}

interface ParallaxConfig {
  speed?: number
  rotation?: boolean
  scale?: boolean
  perspective?: boolean
}

export function useMousePosition() {
  const [mousePosition, setMousePosition] = useState<MousePosition>({
    x: 0,
    y: 0,
    normalizedX: 0,
    normalizedY: 0
  })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const normalizedX = (clientX / window.innerWidth) * 2 - 1
      const normalizedY = (clientY / window.innerHeight) * 2 - 1

      setMousePosition({
        x: clientX,
        y: clientY,
        normalizedX,
        normalizedY
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return mousePosition
}

export function useParallax(config: ParallaxConfig = {}) {
  const { speed = 1, rotation = false, scale = false, perspective = false } = config
  const elementRef = useRef<HTMLDivElement>(null)
  const mousePosition = useMousePosition()

  useEffect(() => {
    if (!elementRef.current) return

    const element = elementRef.current
    const rect = element.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    // Calculate distance from center
    const deltaX = (mousePosition.x - centerX) * speed * 0.01
    const deltaY = (mousePosition.y - centerY) * speed * 0.01

    let transform = `translate(${deltaX}px, ${deltaY}px)`

    if (rotation) {
      const rotateX = deltaY * 0.5
      const rotateY = deltaX * 0.5
      transform += ` rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
    }

    if (scale) {
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const scaleValue = 1 + Math.min(distance * 0.001, 0.1)
      transform += ` scale(${scaleValue})`
    }

    if (perspective) {
      element.style.perspective = '1000px'
      element.style.transformStyle = 'preserve-3d'
    }

    element.style.transform = transform
    element.style.transition = 'transform 0.1s ease-out'
  }, [mousePosition, speed, rotation, scale, perspective])

  return elementRef
}

export function useTilt() {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!isHovered) return

      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const rotateX = ((y - centerY) / centerY) * -15
      const rotateY = ((x - centerX) / centerX) * 15

      card.style.transform = `
        perspective(1000px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        scale3d(1.05, 1.05, 1.05)
      `
    }

    const handleMouseEnter = () => {
      setIsHovered(true)
      card.style.transition = 'transform 0.3s ease'
    }

    const handleMouseLeave = () => {
      setIsHovered(false)
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)'
    }

    card.addEventListener('mousemove', handleMouseMove)
    card.addEventListener('mouseenter', handleMouseEnter)
    card.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      card.removeEventListener('mousemove', handleMouseMove)
      card.removeEventListener('mouseenter', handleMouseEnter)
      card.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [isHovered])

  return cardRef
}

export function useScrollParallax(speed: number = 0.5) {
  const elementRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (!elementRef.current) return
      
      const scrolled = window.pageYOffset
      const rate = scrolled * speed * -1
      setOffset(rate)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed])

  useEffect(() => {
    if (elementRef.current) {
      elementRef.current.style.transform = `translateY(${offset}px)`
    }
  }, [offset])

  return elementRef
}

export function useFloatingAnimation(
  duration: number = 3,
  distance: number = 20
) {
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!elementRef.current) return

    const element = elementRef.current
    let animationId: number

    const animate = () => {
      const time = Date.now() / 1000
      const y = Math.sin(time / duration) * distance
      const x = Math.cos(time / duration * 0.5) * (distance * 0.5)
      
      element.style.transform = `translate(${x}px, ${y}px)`
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [duration, distance])

  return elementRef
}

export function useGlowEffect() {
  const elementRef = useRef<HTMLDivElement>(null)
  const mousePosition = useMousePosition()

  useEffect(() => {
    if (!elementRef.current) return

    const element = elementRef.current
    const rect = element.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const distance = Math.sqrt(
      Math.pow(mousePosition.x - centerX, 2) +
      Math.pow(mousePosition.y - centerY, 2)
    )

    const maxDistance = 500
    const intensity = Math.max(0, 1 - distance / maxDistance)

    element.style.boxShadow = `
      0 0 ${20 + intensity * 30}px rgba(0, 255, 136, ${intensity * 0.6}),
      0 0 ${40 + intensity * 60}px rgba(0, 136, 255, ${intensity * 0.3})
    `
  }, [mousePosition])

  return elementRef
}