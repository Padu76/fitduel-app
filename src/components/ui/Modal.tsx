'use client'

import { Fragment, ReactNode, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'
import Button from './Button'

// ====================================
// TYPES & INTERFACES
// ====================================
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  className?: string
  overlayClassName?: string
  animate?: boolean
  centered?: boolean
  footer?: ReactNode
  preventScroll?: boolean
}

export interface AlertModalProps extends Omit<ModalProps, 'children'> {
  type?: 'info' | 'warning' | 'error' | 'success'
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
}

// ====================================
// STYLES CONFIGURATION
// ====================================
const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4',
}

const alertIcons = {
  info: <Info className="w-6 h-6 text-blue-500" />,
  warning: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
  error: <AlertCircle className="w-6 h-6 text-red-500" />,
  success: <CheckCircle className="w-6 h-6 text-green-500" />,
}

const alertColors = {
  info: 'border-blue-500/20 bg-blue-500/10',
  warning: 'border-yellow-500/20 bg-yellow-500/10',
  error: 'border-red-500/20 bg-red-500/10',
  success: 'border-green-500/20 bg-green-500/10',
}

// ====================================
// ANIMATION VARIANTS
// ====================================
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const modalVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.9,
    y: 20,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.2,
    }
  }
}

// ====================================
// MODAL COMPONENT
// ====================================
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
  overlayClassName,
  animate = true,
  centered = true,
  footer,
  preventScroll = true,
}: ModalProps) {
  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [closeOnEscape, isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!preventScroll) return

    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, preventScroll])

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      onClose()
    }
  }

  const modalContent = (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm z-50',
          overlayClassName
        )}
        onClick={handleOverlayClick}
      />

      {/* Modal */}
      <div
        className={cn(
          'fixed inset-0 z-50',
          'flex',
          centered ? 'items-center justify-center' : 'items-start justify-center pt-20',
          'p-4'
        )}
        onClick={handleOverlayClick}
      >
        <div
          className={cn(
            'relative w-full',
            sizes[size],
            'bg-gray-900',
            'border border-gray-800',
            'rounded-2xl',
            'shadow-2xl',
            'max-h-[90vh]',
            'flex flex-col',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between p-6 border-b border-gray-800">
              <div className="flex-1">
                {title && (
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1 text-sm text-gray-400">
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="ml-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="p-6 border-t border-gray-800">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  )

  if (!animate) {
    return isOpen ? modalContent : null
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Animated Overlay */}
          <motion.div
            key="overlay"
            className={cn(
              'fixed inset-0 bg-black/60 backdrop-blur-sm z-50',
              overlayClassName
            )}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={overlayVariants}
            onClick={handleOverlayClick}
          />

          {/* Animated Modal */}
          <motion.div
            key="modal-wrapper"
            className={cn(
              'fixed inset-0 z-50',
              'flex',
              centered ? 'items-center justify-center' : 'items-start justify-center pt-20',
              'p-4'
            )}
            onClick={handleOverlayClick}
          >
            <motion.div
              className={cn(
                'relative w-full',
                sizes[size],
                'bg-gray-900',
                'border border-gray-800',
                'rounded-2xl',
                'shadow-2xl',
                'max-h-[90vh]',
                'flex flex-col',
                className
              )}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={modalVariants}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-start justify-between p-6 border-b border-gray-800">
                  <div className="flex-1">
                    {title && (
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p className="mt-1 text-sm text-gray-400">
                        {description}
                      </p>
                    )}
                  </div>
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="ml-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                      aria-label="Close modal"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="p-6 border-t border-gray-800">
                  {footer}
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ====================================
// ALERT MODAL COMPONENT
// ====================================
export function AlertModal({
  type = 'info',
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  onConfirm,
  onCancel,
  loading = false,
  title,
  description,
  ...modalProps
}: AlertModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    if (onConfirm) {
      setIsLoading(true)
      try {
        await onConfirm()
      } finally {
        setIsLoading(false)
      }
    }
    modalProps.onClose()
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
    modalProps.onClose()
  }

  return (
    <Modal
      {...modalProps}
      title={title}
      footer={
        <div className="flex gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={isLoading || loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={type === 'error' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            loading={isLoading || loading}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="flex gap-4">
        <div className={cn(
          'flex-shrink-0 p-3 rounded-full',
          alertColors[type]
        )}>
          {alertIcons[type]}
        </div>
        <div className="flex-1">
          {description && (
            <p className="text-gray-300">{description}</p>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ====================================
// DRAWER COMPONENT
// ====================================
interface DrawerProps extends Omit<ModalProps, 'centered' | 'size'> {
  position?: 'left' | 'right' | 'top' | 'bottom'
  width?: string
  height?: string
}

export function Drawer({
  position = 'right',
  width = '400px',
  height = '400px',
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  overlayClassName,
  animate = true,
  footer,
  ...props
}: DrawerProps) {
  const positionStyles = {
    left: `left-0 top-0 h-full w-[${width}] max-w-[90vw]`,
    right: `right-0 top-0 h-full w-[${width}] max-w-[90vw]`,
    top: `top-0 left-0 w-full h-[${height}] max-h-[90vh]`,
    bottom: `bottom-0 left-0 w-full h-[${height}] max-h-[90vh]`,
  }

  const slideVariants = {
    left: {
      hidden: { x: '-100%' },
      visible: { x: 0 },
      exit: { x: '-100%' },
    },
    right: {
      hidden: { x: '100%' },
      visible: { x: 0 },
      exit: { x: '100%' },
    },
    top: {
      hidden: { y: '-100%' },
      visible: { y: 0 },
      exit: { y: '-100%' },
    },
    bottom: {
      hidden: { y: '100%' },
      visible: { y: 0 },
      exit: { y: '100%' },
    },
  }

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [closeOnEscape, isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="drawer-overlay"
            className={cn(
              'fixed inset-0 bg-black/60 backdrop-blur-sm z-50',
              overlayClassName
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOnOverlayClick ? onClose : undefined}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            className={cn(
              'fixed z-50',
              'bg-gray-900',
              'border-gray-800',
              position === 'left' && 'border-r',
              position === 'right' && 'border-l',
              position === 'top' && 'border-b',
              position === 'bottom' && 'border-t',
              'shadow-2xl',
              'flex flex-col',
              positionStyles[position],
              className
            )}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={slideVariants[position]}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                {title && (
                  <h2 className="text-2xl font-bold">
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="ml-auto p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="p-6 border-t border-gray-800">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ====================================
// EXPORTS
// ====================================
export default Modal