'use client'

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, ReactNode, useState } from 'react'
import { Eye, EyeOff, Check, X, AlertCircle, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

// ====================================
// TYPES & INTERFACES
// ====================================
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  success?: string
  hint?: string
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled' | 'ghost' | 'bordered'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  loading?: boolean
  clearable?: boolean
  onClear?: () => void
  showPasswordToggle?: boolean
  fullWidth?: boolean
  animate?: boolean
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  success?: string
  hint?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled' | 'ghost' | 'bordered'
  rounded?: 'none' | 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  animate?: boolean
  showCount?: boolean
  maxLength?: number
}

// ====================================
// STYLES CONFIGURATION
// ====================================
const variants = {
  default: cn(
    'bg-gray-900/50',
    'border border-gray-700',
    'focus:border-indigo-500',
    'hover:border-gray-600'
  ),
  filled: cn(
    'bg-gray-800',
    'border border-transparent',
    'focus:bg-gray-700',
    'hover:bg-gray-700/70'
  ),
  ghost: cn(
    'bg-transparent',
    'border border-transparent',
    'focus:bg-gray-900/50',
    'hover:bg-gray-900/30'
  ),
  bordered: cn(
    'bg-transparent',
    'border-2 border-gray-700',
    'focus:border-indigo-500',
    'hover:border-gray-600'
  ),
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-3 text-lg',
}

const roundedStyles = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  full: 'rounded-full',
}

const labelSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

// ====================================
// INPUT COMPONENT
// ====================================
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      success,
      hint,
      icon,
      iconPosition = 'left',
      size = 'md',
      variant = 'default',
      rounded = 'lg',
      loading = false,
      clearable = false,
      onClear,
      showPasswordToggle = false,
      fullWidth = false,
      animate = true,
      type = 'text',
      disabled,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    
    const isPassword = type === 'password'
    const inputType = isPassword && showPassword ? 'text' : type

    // Base styles
    const baseStyles = cn(
      'w-full',
      'text-white placeholder-gray-500',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-indigo-500/50',
      'disabled:opacity-50 disabled:cursor-not-allowed'
    )

    // Error/Success states
    const stateStyles = cn(
      error && 'border-red-500 focus:border-red-500 focus:ring-red-500/50',
      success && 'border-green-500 focus:border-green-500 focus:ring-green-500/50'
    )

    // Combine all styles
    const inputStyles = cn(
      baseStyles,
      variants[variant],
      sizes[size],
      roundedStyles[rounded],
      stateStyles,
      (icon && iconPosition === 'left') && 'pl-10',
      (icon && iconPosition === 'right') && 'pr-10',
      clearable && 'pr-10',
      isPassword && showPasswordToggle && 'pr-10',
      className
    )

    // Container for animations
    const InputContainer = animate ? motion.div : 'div'
    const animationProps = animate ? {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.2 }
    } : {}

    return (
      <InputContainer 
        className={cn('relative', fullWidth && 'w-full')}
        {...animationProps}
      >
        {/* Label */}
        {label && (
          <label className={cn(
            'block mb-2 font-medium text-gray-300',
            labelSizes[size]
          )}>
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Left icon */}
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}

          {/* Input field */}
          <input
            ref={ref}
            type={inputType}
            className={inputStyles}
            disabled={disabled || loading}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />

          {/* Right side elements */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {/* Loading spinner */}
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-indigo-500" />
            )}

            {/* Clear button */}
            {clearable && value && !loading && (
              <button
                type="button"
                onClick={onClear}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Password toggle */}
            {isPassword && showPasswordToggle && !loading && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Right icon */}
            {icon && iconPosition === 'right' && !clearable && !isPassword && (
              <div className="text-gray-400 pointer-events-none">
                {icon}
              </div>
            )}

            {/* Status icons */}
            {error && <AlertCircle className="w-4 h-4 text-red-500" />}
            {success && <Check className="w-4 h-4 text-green-500" />}
          </div>
        </div>

        {/* Helper text */}
        <AnimatePresence mode="wait">
          {(error || success || hint) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className={cn(
                'mt-2 text-sm',
                error && 'text-red-400',
                success && 'text-green-400',
                !error && !success && 'text-gray-500'
              )}>
                {error || success || hint}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </InputContainer>
    )
  }
)

Input.displayName = 'Input'

// ====================================
// TEXTAREA COMPONENT
// ====================================
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      success,
      hint,
      size = 'md',
      variant = 'default',
      rounded = 'lg',
      fullWidth = false,
      animate = true,
      showCount = false,
      maxLength,
      value,
      onChange,
      disabled,
      ...props
    },
    ref
  ) => {
    const [charCount, setCharCount] = useState(0)

    // Base styles
    const baseStyles = cn(
      'w-full',
      'text-white placeholder-gray-500',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-indigo-500/50',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'resize-y min-h-[100px]'
    )

    // Error/Success states
    const stateStyles = cn(
      error && 'border-red-500 focus:border-red-500 focus:ring-red-500/50',
      success && 'border-green-500 focus:border-green-500 focus:ring-green-500/50'
    )

    // Combine all styles
    const textareaStyles = cn(
      baseStyles,
      variants[variant],
      sizes[size],
      roundedStyles[rounded],
      stateStyles,
      className
    )

    // Handle change with character count
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (showCount) {
        setCharCount(e.target.value.length)
      }
      if (onChange) {
        onChange(e)
      }
    }

    // Container for animations
    const TextareaContainer = animate ? motion.div : 'div'
    const animationProps = animate ? {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.2 }
    } : {}

    return (
      <TextareaContainer 
        className={cn('relative', fullWidth && 'w-full')}
        {...animationProps}
      >
        {/* Label */}
        {label && (
          <label className={cn(
            'block mb-2 font-medium text-gray-300',
            labelSizes[size]
          )}>
            {label}
          </label>
        )}

        {/* Textarea field */}
        <textarea
          ref={ref}
          className={textareaStyles}
          value={value}
          onChange={handleChange}
          maxLength={maxLength}
          disabled={disabled}
          {...props}
        />

        {/* Footer with helper text and character count */}
        <div className="flex justify-between items-start mt-2">
          {/* Helper text */}
          {(error || success || hint) && (
            <p className={cn(
              'text-sm',
              error && 'text-red-400',
              success && 'text-green-400',
              !error && !success && 'text-gray-500'
            )}>
              {error || success || hint}
            </p>
          )}

          {/* Character count */}
          {showCount && maxLength && (
            <span className={cn(
              'text-sm',
              charCount > maxLength * 0.9 ? 'text-yellow-400' : 'text-gray-500'
            )}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </TextareaContainer>
    )
  }
)

Textarea.displayName = 'Textarea'

// ====================================
// INPUT GROUP COMPONENT
// ====================================
interface InputGroupProps {
  children: ReactNode
  className?: string
}

export const InputGroup = ({ children, className }: InputGroupProps) => (
  <div className={cn('flex', className)}>
    {children}
  </div>
)

// ====================================
// INPUT ADDON COMPONENT
// ====================================
interface InputAddonProps {
  children: ReactNode
  position?: 'left' | 'right'
  className?: string
}

export const InputAddon = ({ 
  children, 
  position = 'left',
  className 
}: InputAddonProps) => (
  <div className={cn(
    'flex items-center px-4 bg-gray-800 border border-gray-700',
    position === 'left' && 'rounded-l-lg border-r-0',
    position === 'right' && 'rounded-r-lg border-l-0',
    className
  )}>
    {children}
  </div>
)

// ====================================
// SEARCH INPUT COMPONENT
// ====================================
interface SearchInputProps extends Omit<InputProps, 'type'> {
  onSearch?: (value: string) => void
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onSearch) {
        onSearch(e.currentTarget.value)
      }
    }

    return (
      <Input
        ref={ref}
        type="search"
        placeholder="Cerca..."
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
        onKeyDown={handleKeyDown}
        {...props}
      />
    )
  }
)

SearchInput.displayName = 'SearchInput'

// ====================================
// PIN INPUT COMPONENT
// ====================================
interface PinInputProps {
  length?: number
  value?: string
  onChange?: (value: string) => void
  onComplete?: (value: string) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const PinInput = ({ 
  length = 6, 
  value = '',
  onChange,
  onComplete,
  size = 'md',
  className 
}: PinInputProps) => {
  const [pins, setPins] = useState<string[]>(Array(length).fill(''))

  const handleChange = (index: number, val: string) => {
    if (val.length > 1) return
    
    const newPins = [...pins]
    newPins[index] = val
    setPins(newPins)
    
    const fullValue = newPins.join('')
    if (onChange) onChange(fullValue)
    
    // Auto-focus next input
    if (val && index < length - 1) {
      const nextInput = document.getElementById(`pin-${index + 1}`)
      nextInput?.focus()
    }
    
    // Check if complete
    if (fullValue.length === length && onComplete) {
      onComplete(fullValue)
    }
  }

  const pinSizes = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-14 h-14 text-lg',
  }

  return (
    <div className={cn('flex gap-2', className)}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          id={`pin-${index}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]"
          maxLength={1}
          value={pins[index]}
          onChange={(e) => handleChange(index, e.target.value)}
          className={cn(
            pinSizes[size],
            'text-center font-bold',
            'bg-gray-900/50 border border-gray-700',
            'rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500',
            'transition-all duration-200'
          )}
        />
      ))}
    </div>
  )
}

// ====================================
// EXPORTS
// ====================================
export { Input, Textarea }
export default Input