'use client'

import Link from 'next/link'
import { cn } from '@/lib/cn'

type ButtonProps = {
  children: React.ReactNode
  styleType?: 'primary' | 'secondary' | 'tertiary' | 'formPrimary' | 'formSecondary'
  href?: string
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  className?: string
  disabled?: boolean
  loading?: boolean
  link?: boolean
  title?: string
}

const Button = ({
  children,
  href,
  styleType = 'primary',
  type = 'button',
  onClick,
  className,
  disabled,
  loading,
  title
}: ButtonProps) => {
  const btnStyles = {
    primary:
      'inline-flex items-center justify-center rounded-xl bg-secondary px-6 py-3 text-base font-semibold text-primary shadow hover:bg-secondary/80',
    secondary:
      'inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white shadow hover:bg-primary/80',
    tertiary: 'inline-block rounded-xl px-12 py-3 text-sm font-medium border',
    formPrimary:
      'inline-flex items-center justify-center bg-primary text-primary-foreground text-white rounded-xl px-4 py-2',
    formSecondary:
      'inline-flex items-center justify-center px-4 py-2 border rounded text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors'
  }

  const isDisabled = disabled || loading
  const disabledStyles = isDisabled ? 'cursor-not-allowed opacity-50 focus:ring-0' : ''

  if (href) {
    return (
      <Link href={isDisabled ? '#' : href} className={cn('min-w-20', btnStyles[styleType], disabledStyles, className)}>
        {loading ? 'Cargando...' : children}
      </Link>
    )
  }

  return (
    <button
      type={type}
      className={cn('min-w-20 cursor-pointer', btnStyles[styleType], disabledStyles, className)}
      onClick={!isDisabled ? onClick : undefined}
      disabled={isDisabled}
      title={title}
    >
      {loading ? 'Cargando...' : children}
    </button>
  )
}

export default Button
