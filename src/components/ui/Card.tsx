'use client'

import { HTMLAttributes, forwardRef, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

// ====================================
// TYPES & INTERFACES
// ====================================
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'glass' | 'solid' | 'bordered'
  hover?: boolean
  glow?: boolean
  interactive?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  animate?: boolean
  glowColor?: 'indigo' | 'purple' | 'green' | 'red' | 'yellow' | 'blue'
  gradient?: 'indigo' | 'purple' | 'sunset' | 'ocean' | 'fire' | 'nature'
}

// ====================================
// STYLES CONFIGURATION
// ====================================
const variants = {
  default: cn(
    'bg-gray-900/50',
    'backdrop-blur-sm',
    'border border-gray-800'
  ),
  gradient: cn(
    'bg-gradient-to-br',
    'border border-gray-800/50'
  ),
  glass: cn(
    'bg-gray-900/30',
    'backdrop-blur-md',
    'border border-gray-800/50'
  ),
  solid: cn(
    'bg-gray-900',
    'border border-gray-800'
  ),
  bordered: cn(
    'bg-transparent',
    'border-2 border-gray-700'
  ),
}

const gradients = {
  indigo: 'from-indigo-900/50 to-purple-900/50',
  purple: 'from-purple-900/50 to-pink-900/50',
  sunset: 'from-orange-900/50 to-red-900/50',
  ocean: 'from-blue-900/50 to-cyan-900/50',
  fire: 'from-red-900/50 to-yellow-900/50',
  nature: 'from-green-900/50 to-emerald-900/50',
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
}

const roundedStyles = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  xl: 'rounded-2xl',
  '2xl': 'rounded-3xl',
  '3xl': 'rounded-[2rem]',
}

const shadows = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
}

const glowColors = {
  indigo: 'shadow-indigo-500/25 hover:shadow-indigo-500/40',
  purple: 'shadow-purple-500/25 hover:shadow-purple-500/40',
  green: 'shadow-green-500/25 hover:shadow-green-500/40',
  red: 'shadow-red-500/25 hover:shadow-red-500/40',
  yellow: 'shadow-yellow-500/25 hover:shadow-yellow-500/40',
  blue: 'shadow-blue-500/25 hover:shadow-blue-500/40',
}

// ====================================
// ANIMATION VARIANTS
// ====================================
const cardAnimations = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  hover: { 
    y: -4,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 17,
    }
  },
  tap: { scale: 0.98 },
}

// ====================================
// CARD COMPONENT
// ====================================
const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      hover = false,
      glow = false,
      interactive = false,
      padding = 'md',
      rounded = 'xl',
      shadow = 'lg',
      animate = false,
      glowColor = 'indigo',
      gradient = 'indigo',
      children,
      onClick,
      // Extract HTML event handlers that conflict with Framer Motion
      onDrag,
      onDragEnd,
      onDragStart,
      onAnimationStart,
      onAnimationEnd,
      ...restProps
    },
    ref
  ) => {
    // Base styles
    const baseStyles = cn(
      'relative',
      'transition-all duration-300',
      'overflow-hidden'
    )

    // Interactive styles
    const interactiveStyles = interactive && cn(
      'cursor-pointer',
      'hover:border-gray-700',
      'active:scale-[0.98]'
    )

    // Hover effect
    const hoverStyles = hover && cn(
      'hover:transform hover:-translate-y-1',
      'hover:shadow-xl'
    )

    // Combine all styles
    const cardStyles = cn(
      baseStyles,
      variants[variant],
      variant === 'gradient' && gradients[gradient],
      paddings[padding],
      roundedStyles[rounded],
      shadows[shadow],
      glow && glowColors[glowColor],
      interactiveStyles,
      hoverStyles,
      className
    )

    // If animations are disabled, render regular div
    if (!animate) {
      return (
        <div
          ref={ref}
          className={cardStyles}
          onClick={onClick}
          {...restProps}
        >
          {children}
        </div>
      )
    }

    // Render animated card
    return (
      <motion.div
        ref={ref}
        className={cardStyles}
        onClick={onClick}
        initial={cardAnimations.initial}
        animate={cardAnimations.animate}
        whileHover={interactive ? cardAnimations.hover : undefined}
        whileTap={interactive ? cardAnimations.tap : undefined}
        transition={{
          duration: 0.3,
          ease: 'easeOut',
        }}
        // Only pass non-conflicting props
        {...Object.fromEntries(
          Object.entries(restProps).filter(
            ([key]) => !['style', 'data-testid', 'aria-label'].includes(key)
          )
        )}
      >
        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'

// ====================================
// CARD HEADER COMPONENT
// ====================================
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  separator?: boolean
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, separator = false, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col space-y-1.5',
        separator && 'pb-6 border-b border-gray-800',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)

CardHeader.displayName = 'CardHeader'

// ====================================
// CARD TITLE COMPONENT
// ====================================
export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-2xl font-bold',
        'bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
)

CardTitle.displayName = 'CardTitle'

// ====================================
// CARD DESCRIPTION COMPONENT
// ====================================
export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-400', className)}
      {...props}
    >
      {children}
    </p>
  )
)

CardDescription.displayName = 'CardDescription'

// ====================================
// CARD CONTENT COMPONENT
// ====================================
export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('', className)}
      {...props}
    >
      {children}
    </div>
  )
)

CardContent.displayName = 'CardContent'

// ====================================
// CARD FOOTER COMPONENT
// ====================================
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  separator?: boolean
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, separator = false, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center',
        separator && 'pt-6 mt-6 border-t border-gray-800',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)

CardFooter.displayName = 'CardFooter'

// ====================================
// STAT CARD COMPONENT
// ====================================
interface StatCardProps extends CardProps {
  title: string
  value: string | number
  description?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      title,
      value,
      description,
      icon,
      trend,
      trendValue,
      className,
      ...props
    },
    ref
  ) => {
    const trendColors = {
      up: 'text-green-400',
      down: 'text-red-400',
      neutral: 'text-gray-400',
    }

    const trendIcons = {
      up: '↑',
      down: '↓',
      neutral: '→',
    }

    return (
      <Card
        ref={ref}
        className={className}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-1">{title}</p>
            <p className="text-3xl font-bold mb-2">{value}</p>
            {(trend || trendValue) && (
              <div className="flex items-center gap-1">
                {trend && (
                  <span className={cn('text-sm', trendColors[trend])}>
                    {trendIcons[trend]}
                  </span>
                )}
                {trendValue && (
                  <span className={cn('text-sm', trend && trendColors[trend])}>
                    {trendValue}
                  </span>
                )}
              </div>
            )}
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
          {icon && (
            <div className="text-gray-600">
              {icon}
            </div>
          )}
        </div>
      </Card>
    )
  }
)

StatCard.displayName = 'StatCard'

// ====================================
// HOVER CARD COMPONENT
// ====================================
interface HoverCardProps extends CardProps {
  hoverContent?: ReactNode
}

export const HoverCard = forwardRef<HTMLDivElement, HoverCardProps>(
  ({ children, hoverContent, className, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn('group relative', className)}
        hover
        interactive
        {...props}
      >
        <div className="transition-opacity duration-300 group-hover:opacity-0">
          {children}
        </div>
        {hoverContent && (
          <div className="absolute inset-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            {hoverContent}
          </div>
        )}
      </Card>
    )
  }
)

HoverCard.displayName = 'HoverCard'

// ====================================
// SKELETON CARD COMPONENT
// ====================================
export const SkeletonCard = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = 'md', ...props }, ref) => (
    <Card
      ref={ref}
      className={cn('animate-pulse', className)}
      padding={padding}
      {...props}
    >
      <div className="space-y-3">
        <div className="h-4 bg-gray-800 rounded w-3/4"></div>
        <div className="h-4 bg-gray-800 rounded w-1/2"></div>
        <div className="h-4 bg-gray-800 rounded w-5/6"></div>
      </div>
    </Card>
  )
)

SkeletonCard.displayName = 'SkeletonCard'

// ====================================
// EXPORTS
// ====================================
export { Card }
export default Card