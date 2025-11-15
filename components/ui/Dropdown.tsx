'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'
import { useRef, useEffect, useState } from 'react'
import clsx from 'clsx'

interface DropdownItem {
  label: string
  icon?: ReactNode
  onClick: () => void
  danger?: boolean
}

interface DropdownProps {
  items: DropdownItem[]
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  position?: 'left' | 'right' | 'center' | 'auto' | 'top'
}

export function Dropdown({ items, isOpen, onClose, children, position = 'auto' }: DropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [calculatedPosition, setCalculatedPosition] = useState<'top' | 'bottom'>('bottom')
  const [horizontalPosition, setHorizontalPosition] = useState<'left' | 'right' | 'center'>('right')

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const calculatePosition = () => {
        if (!dropdownRef.current || typeof window === 'undefined') return

        const triggerRect = dropdownRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const viewportWidth = window.innerWidth
        const isMobile = window.innerWidth < 640 // sm breakpoint

        // Tìm scrollable container cha gần nhất
        let scrollableContainer: HTMLElement | null = dropdownRef.current.parentElement
        while (scrollableContainer) {
          const style = window.getComputedStyle(scrollableContainer)
          if (style.overflow === 'auto' || style.overflow === 'scroll' || 
              style.overflowY === 'auto' || style.overflowY === 'scroll') {
            break
          }
          scrollableContainer = scrollableContainer.parentElement
        }

        // Tính toán vị trí dọc
        // Nếu position prop là 'top', luôn hiển thị phía trên
        if (position === 'top') {
          setCalculatedPosition('top')
        } else {
        if (isMobile) {
          setCalculatedPosition('bottom')
        } else {
            // Tính toán dựa trên cả viewport và container scrollable
            let spaceBelow = viewportHeight - triggerRect.bottom
            let spaceAbove = triggerRect.top
            
            if (scrollableContainer) {
              const containerRect = scrollableContainer.getBoundingClientRect()
              const containerSpaceBelow = containerRect.bottom - triggerRect.bottom
              const containerSpaceAbove = triggerRect.top - containerRect.top
              
              // Ưu tiên không gian trong container, nhưng cũng xem xét viewport
              spaceBelow = Math.min(spaceBelow, containerSpaceBelow)
              spaceAbove = Math.min(spaceAbove, containerSpaceAbove)
            }
            
          const menuHeight = 400 // ước tính chiều cao menu
          const shouldShowAbove = spaceBelow < menuHeight && spaceAbove > spaceBelow
          setCalculatedPosition(shouldShowAbove ? 'top' : 'bottom')
          }
        }

        // Tính toán vị trí ngang (chỉ khi position = 'auto')
        if (position === 'auto') {
          let spaceRight = viewportWidth - triggerRect.right
          let spaceLeft = triggerRect.left
          const menuWidth = 200 // ước tính chiều rộng menu

          if (scrollableContainer) {
            const containerRect = scrollableContainer.getBoundingClientRect()
            const containerSpaceRight = containerRect.right - triggerRect.right
            const containerSpaceLeft = triggerRect.left - containerRect.left
            
            // Ưu tiên không gian trong container
            spaceRight = Math.min(spaceRight, containerSpaceRight)
            spaceLeft = Math.min(spaceLeft, containerSpaceLeft)
          }

          if (isMobile) {
            // Trên mobile, luôn hiển thị bên phải (hoặc left nếu gần cạnh phải)
            setHorizontalPosition(spaceRight < 50 ? 'right' : 'left')
          } else {
            if (spaceRight >= menuWidth) {
              setHorizontalPosition('left')
            } else if (spaceLeft >= menuWidth) {
              setHorizontalPosition('right')
            } else {
              // Không đủ chỗ, chọn phía có nhiều chỗ hơn
              setHorizontalPosition(spaceRight > spaceLeft ? 'left' : 'right')
            }
          }
        } else {
          setHorizontalPosition(position as 'left' | 'right' | 'center')
        }
      }

      // Delay để đảm bảo DOM đã render
      const timeoutId = setTimeout(() => {
        calculatePosition()
      }, 10)

      window.addEventListener('resize', calculatePosition)
      window.addEventListener('scroll', calculatePosition, true)
      
      return () => {
        clearTimeout(timeoutId)
        window.removeEventListener('resize', calculatePosition)
        window.removeEventListener('scroll', calculatePosition, true)
      }
    }
  }, [isOpen, position])

  const getPositionClasses = () => {
    const vertical = calculatedPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
    const horizontal = 
      horizontalPosition === 'left' ? 'left-0' :
      horizontalPosition === 'right' ? 'right-0' :
      'left-1/2 transform -translate-x-1/2'
    
    return `${vertical} ${horizontal}`
  }

  return (
    <div className="relative" ref={dropdownRef} style={{ zIndex: isOpen ? 99999 : 'auto' }}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            className={clsx(
              'absolute z-[99999] min-w-[200px] max-w-[90vw] sm:max-w-none',
              'glass-strong rounded-apple-lg shadow-apple-lg',
              'border border-apple-gray-200 dark:border-apple-gray-800',
              'overflow-visible pr-2',
              getPositionClasses()
            )}
            initial={{ opacity: 0, y: calculatedPosition === 'top' ? 10 : -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: calculatedPosition === 'top' ? 10 : -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="py-2 max-h-[60vh] overflow-y-auto scrollbar-hide">
              {items.map((item, index) => (
                <motion.button
                  key={index}
                  className={clsx(
                    'w-full flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors rounded-apple mx-1',
                    item.danger
                      ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10'
                      : 'text-apple-primary hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800'
                  )}
                  onClick={() => {
                    item.onClick()
                    onClose()
                  }}
                  whileHover={{ x: 2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
                  <span className="text-left">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
