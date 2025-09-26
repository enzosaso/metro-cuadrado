import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

type ClassValue = string | undefined | null | false | { [key: string]: string }

export const cn = (...classes: ClassValue[]) => twMerge(clsx(...classes))
