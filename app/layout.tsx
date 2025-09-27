import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import ProviderWrapper from '@/components/providers/provider-wrapper'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'Metro Cuadrado',
  description: 'Tu presupuesto de obra, al instante'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ProviderWrapper>{children}</ProviderWrapper>
      </body>
    </html>
  )
}
