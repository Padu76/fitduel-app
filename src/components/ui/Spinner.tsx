'use client'

import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

// ====================================
// TYPES & INTERFACES
// ====================================
export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'dots' | 'pulse' | 'bars' | 'dual' | 'orbit'
  color?: 'primary' | 'secondary' | 'white' | 'gradient'
  className?: string
  label?: string
  showLabel?: boolean
  fullScreen?: boolean
  overlay?: boolean
}

// ====================================
// STYLES CONFIGURATION
// ====================================
const sizes = {
  xs: 'w-4 h-4',
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
}

const labelSizes = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
}

const colors = {
  primary: 'border-indigo-500',
  secondary: 'border-gray-500',
  white: 'border-white',
  gradient: 'border-indigo-500',
}

const dotColors = {
  primary: 'bg-indigo-500',
  secondary: 'bg-gray-500',
  white: 'bg-white',
  gradient: 'bg-gradient-to-r from-indigo-500 to-purple-500',
}

// ====================================
// DEFAULT SPINNER
// ====================================
const DefaultSpinner = ({ size = 'md', color = 'primary', className }: SpinnerProps) => (
  <div
    className={cn(
      'animate-spin rounded-full',
      'border-2 border-gray-700',
      'border-t-2',
      sizes[size],
      colors[color],
      className
    )}
  />
)

// ====================================
// DOTS SPINNER
// ====================================
const DotsSpinner = ({ size = 'md', color = 'primary', className }: SpinnerProps) => {
  const dotSizes = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  }

  const containerSizes = {
    xs: 'gap-1',
    sm: 'gap-1.5',
    md: 'gap-2',
    lg: 'gap-2.5',
    xl: 'gap-3',
  }

  return (
    <div className={cn('flex items-center', containerSizes[size], className)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={cn('rounded-full', dotSizes[size], dotColors[color])}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ====================================
// PULSE SPINNER
// ====================================
const PulseSpinner = ({ size = 'md', color = 'primary', className }: SpinnerProps) => {
  const pulseColors = {
    primary: 'bg-indigo-500',
    secondary: 'bg-gray-500',
    white: 'bg-white',
    gradient: 'bg-gradient-to-r from-indigo-500 to-purple-500',
  }

  return (
    <div className={cn('relative', sizes[size], className)}>
      <motion.div
        className={cn('absolute inset-0 rounded-full', pulseColors[color])}
        animate={{
          scale: [1, 1.5],
          opacity: [0.5, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />
      <div className={cn('relative rounded-full', sizes[size], pulseColors[color])} />
    </div>
  )
}

// ====================================
// BARS SPINNER
// ====================================
const BarsSpinner = ({ size = 'md', color = 'primary', className }: SpinnerProps) => {
  const barSizes = {
    xs: 'w-1 h-3',
    sm: 'w-1.5 h-4',
    md: 'w-2 h-6',
    lg: 'w-3 h-8',
    xl: 'w-4 h-10',
  }

  const gapSizes = {
    xs: 'gap-0.5',
    sm: 'gap-1',
    md: 'gap-1.5',
    lg: 'gap-2',
    xl: 'gap-2.5',
  }

  return (
    <div className={cn('flex items-center', gapSizes[size], className)}>
      {[0, 1, 2, 3].map((index) => (
        <motion.div
          key={index}
          className={cn('rounded-full', barSizes[size], dotColors[color])}
          animate={{
            scaleY: [1, 1.5, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ====================================
// DUAL RING SPINNER
// ====================================
const DualSpinner = ({ size = 'md', color = 'primary', className }: SpinnerProps) => {
  return (
    <div className={cn('relative', sizes[size], className)}>
      <motion.div
        className={cn(
          'absolute inset-0 rounded-full border-2',
          'border-gray-700',
          'border-t-2',
          colors[color]
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <motion.div
        className={cn(
          'absolute inset-2 rounded-full border-2',
          'border-gray-700',
          'border-b-2',
          colors[color]
        )}
        animate={{ rotate: -360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  )
}

// ====================================
// ORBIT SPINNER
// ====================================
const OrbitSpinner = ({ size = 'md', color = 'primary', className }: SpinnerProps) => {
  const orbitSizes = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  }

  return (
    <div className={cn('relative', sizes[size], className)}>
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <div className={cn(
          'absolute top-0 left-1/2 -translate-x-1/2',
          'rounded-full',
          orbitSizes[size],
          dotColors[color]
        )} />
        <div className={cn(
          'absolute bottom-0 left-1/2 -translate-x-1/2',
          'rounded-full opacity-50',
          orbitSizes[size],
          dotColors[color]
        )} />
      </motion.div>
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: -360 }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <div className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2',
          'rounded-full opacity-75',
          orbitSizes[size],
          dotColors[color]
        )} />
        <div className={cn(
          'absolute right-0 top-1/2 -translate-y-1/2',
          'rounded-full opacity-25',
          orbitSizes[size],
          dotColors[color]
        )} />
      </motion.div>
    </div>
  )
}

// ====================================
// MAIN SPINNER COMPONENT
// ====================================
export function Spinner({
  size = 'md',
  variant = 'default',
  color = 'primary',
  className,
  label = 'Caricamento...',
  showLabel = false,
  fullScreen = false,
  overlay = false,
}: SpinnerProps) {
  const spinnerVariants = {
    default: DefaultSpinner,
    dots: DotsSpinner,
    pulse: PulseSpinner,
    bars: BarsSpinner,
    dual: DualSpinner,
    orbit: OrbitSpinner,
  }

  const SpinnerComponent = spinnerVariants[variant]

  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center gap-4',
      className
    )}>
      <SpinnerComponent size={size} color={color} />
      {showLabel && label && (
        <span className={cn(
          'text-gray-400',
          labelSizes[size]
        )}>
          {label}
        </span>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className={cn(
        'fixed inset-0 flex items-center justify-center',
        'bg-gray-950',
        overlay && 'bg-gray-950/90 backdrop-blur-sm',
        'z-50'
      )}>
        {content}
      </div>
    )
  }

  return content
}

// ====================================
// LOADING OVERLAY COMPONENT
// ====================================
interface LoadingOverlayProps extends SpinnerProps {
  isLoading: boolean
  children?: React.ReactNode
  blur?: boolean
}

export function LoadingOverlay({
  isLoading,
  children,
  blur = true,
  ...spinnerProps
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className={cn(
          'absolute inset-0 flex items-center justify-center',
          'bg-gray-950/50',
          blur && 'backdrop-blur-sm',
          'z-10 rounded-inherit'
        )}>
          <Spinner {...spinnerProps} />
        </div>
      )}
    </div>
  )
}

// ====================================
// SKELETON LOADER COMPONENT
// ====================================
interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animate?: boolean
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  }

  const style = {
    width: width || (variant === 'circular' ? height : '100%'),
    height: height || (variant === 'circular' ? width : undefined),
  }

  return (
    <div
      className={cn(
        'bg-gray-800',
        variantStyles[variant],
        animate && 'animate-pulse',
        className
      )}
      style={style}
    />
  )
}

// ====================================
// PROGRESS SPINNER COMPONENT
// ====================================
interface ProgressSpinnerProps extends Omit<SpinnerProps, 'variant'> {
  progress: number // 0-100
  showPercentage?: boolean
}

export function ProgressSpinner({
  progress,
  size = 'md',
  color = 'primary',
  showPercentage = true,
  className,
}: ProgressSpinnerProps) {
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const svgSizes = {
    xs: 32,
    sm: 48,
    md: 64,
    lg: 96,
    xl: 128,
  }

  const strokeWidths = {
    xs: 3,
    sm: 4,
    md: 5,
    lg: 6,
    xl: 8,
  }

  const svgSize = svgSizes[size]
  const strokeWidth = strokeWidths[size]

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={svgSize}
        height={svgSize}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-700"
        />
        {/* Progress circle */}
        <motion.circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={cn(
            color === 'primary' && 'text-indigo-500',
            color === 'secondary' && 'text-gray-500',
            color === 'white' && 'text-white',
            color === 'gradient' && 'text-purple-500'
          )}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          style={{
            strokeDasharray: circumference,
          }}
          transition={{
            duration: 0.5,
            ease: 'easeInOut',
          }}
        />
      </svg>
      {showPercentage && (
        <span className={cn(
          'absolute',
          labelSizes[size],
          'font-semibold'
        )}>
          {Math.round(progress)}%
        </span>
      )}
    </div>
  )
}

// ====================================
// EXPORTS
// ====================================
export default Spinner