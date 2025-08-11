'use client'

import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

// ====================================
// TYPES & INTERFACES
// ====================================
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning' | 'gradient'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
  loading?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  animate?: boolean
  pulse?: boolean
  glow?: boolean
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
}

// ====================================
// STYLES CONFIGURATION
// ====================================
const variants = {
  primary: cn(
    'bg-indigo-600 hover:bg-indigo-700',
    'text-white',
    'border border-transparent',
    'shadow-lg shadow-indigo-500/25',
    'hover:shadow-xl hover:shadow-indigo-500/30',
    'active:shadow-md'
  ),
  secondary: cn(
    'bg-gray-800 hover:bg-gray-700',
    'text-white',
    'border border-gray-700',
    'shadow-lg shadow-gray-800/25',
    'hover:shadow-xl hover:shadow-gray-800/30'
  ),
  ghost: cn(
    'bg-transparent hover:bg-gray-800/50',
    'text-gray-300 hover:text-white',
    'border border-gray-700/50 hover:border-gray-600'
  ),
  danger: cn(
    'bg-red-600 hover:bg-red-700',
    'text-white',
    'border border-transparent',
    'shadow-lg shadow-red-500/25',
    'hover:shadow-xl hover:shadow-red-500/30'
  ),
  success: cn(
    'bg-green-600 hover:bg-green-700',
    'text-white',
    'border border-transparent',
    'shadow-lg shadow-green-500/25',
    'hover:shadow-xl hover:shadow-green-500/30'
  ),
  warning: cn(
    'bg-yellow-600 hover:bg-yellow-700',
    'text-white',
    'border border-transparent',
    'shadow-lg shadow-yellow-500/25',
    'hover:shadow-xl hover:shadow-yellow-500/30'
  ),
  gradient: cn(
    'bg-gradient-to-r from-indigo-600 to-purple-600',
    'hover:from-indigo-700 hover:to-purple-700',
    'text-white',
    'border border-transparent',
    'shadow-lg shadow-purple-500/25',
    'hover:shadow-xl hover:shadow-purple-500/30'
  ),
}

const sizes = {
  xs: 'px-2.5 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
}

const roundedStyles = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  full: 'rounded-full',
}

// ====================================
// ANIMATION VARIANTS
// ====================================
const buttonAnimations = {
  tap: { scale: 0.97 },
  hover: { scale: 1.03 },
  loading: {
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// ====================================
// BUTTON COMPONENT
// ====================================
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled = false,
      icon,
      iconPosition = 'left',
      animate = true,
      pulse = false,
      glow = false,
      rounded = 'lg',
      children,
      type = 'button',
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
    const isDisabled = disabled || loading

    // Base styles
    const baseStyles = cn(
      'relative inline-flex items-center justify-center',
      'font-medium',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-950',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      'select-none'
    )

    // Combine all styles
    const buttonStyles = cn(
      baseStyles,
      variants[variant],
      sizes[size],
      roundedStyles[rounded],
      fullWidth && 'w-full',
      pulse && !isDisabled && 'animate-pulse-slow',
      glow && !isDisabled && variant === 'primary' && 'glow-indigo',
      glow && !isDisabled && variant === 'gradient' && 'glow-purple',
      className
    )

    // Loading spinner component
    const LoadingSpinner = () => (
      <Loader2 
        className={cn(
          'animate-spin',
          size === 'xs' && 'w-3 h-3',
          size === 'sm' && 'w-4 h-4',
          size === 'md' && 'w-5 h-5',
          size === 'lg' && 'w-6 h-6',
          size === 'xl' && 'w-7 h-7'
        )}
      />
    )

    // Icon component with proper spacing
    const IconComponent = () => {
      if (loading) return <LoadingSpinner />
      if (!icon) return null
      
      return (
        <span 
          className={cn(
            'inline-flex items-center',
            children && iconPosition === 'left' && 'mr-2',
            children && iconPosition === 'right' && 'ml-2'
          )}
        >
          {icon}
        </span>
      )
    }

    // Content wrapper for loading state
    const ButtonContent = () => (
      <>
        {(icon || loading) && iconPosition === 'left' && <IconComponent />}
        {children && (
          <span className={cn(loading && 'opacity-0')}>
            {children}
          </span>
        )}
        {icon && !loading && iconPosition === 'right' && <IconComponent />}
        {loading && children && (
          <span className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner />
          </span>
        )}
      </>
    )

    // If animations are disabled, render regular button
    if (!animate) {
      return (
        <button
          ref={ref}
          type={type}
          className={buttonStyles}
          disabled={isDisabled}
          onClick={onClick}
          {...restProps}
        >
          <ButtonContent />
        </button>
      )
    }

    // Render animated button with motion div wrapper
    return (
      <motion.button
        ref={ref}
        type={type}
        className={buttonStyles}
        disabled={isDisabled}
        onClick={onClick}
        whileTap={!isDisabled ? buttonAnimations.tap : undefined}
        whileHover={!isDisabled ? buttonAnimations.hover : undefined}
        animate={loading ? buttonAnimations.loading : undefined}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 17,
        }}
        // Only pass non-conflicting props
        {...Object.fromEntries(
          Object.entries(restProps).filter(
            ([key]) => !['style', 'data-testid', 'aria-label', 'aria-disabled'].includes(key)
          )
        )}
      >
        <ButtonContent />
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

// ====================================
// BUTTON GROUP COMPONENT
// ====================================
interface ButtonGroupProps {
  children: ReactNode
  className?: string
  spacing?: 'none' | 'sm' | 'md' | 'lg'
  direction?: 'horizontal' | 'vertical'
}

export const ButtonGroup = ({ 
  children, 
  className,
  spacing = 'sm',
  direction = 'horizontal'
}: ButtonGroupProps) => {
  const spacingStyles = {
    none: '',
    sm: direction === 'horizontal' ? 'space-x-2' : 'space-y-2',
    md: direction === 'horizontal' ? 'space-x-4' : 'space-y-4',
    lg: direction === 'horizontal' ? 'space-x-6' : 'space-y-6',
  }

  return (
    <div 
      className={cn(
        'flex',
        direction === 'vertical' && 'flex-col',
        spacingStyles[spacing],
        className
      )}
    >
      {children}
    </div>
  )
}

// ====================================
// ICON BUTTON COMPONENT
// ====================================
interface IconButtonProps extends Omit<ButtonProps, 'children' | 'icon'> {
  icon: ReactNode
  label?: string // For accessibility
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, size = 'md', rounded = 'full', ...props }, ref) => {
    // Adjust padding for icon-only buttons
    const iconSizes = {
      xs: 'p-1',
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-3',
      xl: 'p-4',
    }

    return (
      <Button
        ref={ref}
        size={size}
        rounded={rounded}
        className={cn(iconSizes[size], props.className)}
        aria-label={label}
        {...props}
      >
        {icon}
      </Button>
    )
  }
)

IconButton.displayName = 'IconButton'

// ====================================
// FLOATING ACTION BUTTON
// ====================================
interface FloatingActionButtonProps extends IconButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

export const FloatingActionButton = forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({ position = 'bottom-right', className, ...props }, ref) => {
    const positionStyles = {
      'bottom-right': 'bottom-6 right-6',
      'bottom-left': 'bottom-6 left-6',
      'top-right': 'top-6 right-6',
      'top-left': 'top-6 left-6',
    }

    return (
      <IconButton
        ref={ref}
        className={cn(
          'fixed z-50',
          positionStyles[position],
          'shadow-2xl',
          className
        )}
        size="lg"
        variant="gradient"
        {...props}
      />
    )
  }
)

FloatingActionButton.displayName = 'FloatingActionButton'

// ====================================
// EXPORTS
// ====================================
export { Button }
export default Button