"use client"

import { useTheme } from "next-themes"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface ThemeAvatarProps {
  src: string
  alt?: string
  fallback?: React.ReactNode
  className?: string
  onClick?: () => void
}

export function ThemeAvatar({ src, alt, fallback, className, onClick }: ThemeAvatarProps) {
  const { theme } = useTheme()

  const isSvg = src.endsWith(".svg")
  const filterClass = theme === "dark" ? "invert" : ""

  return (
    <Avatar className={cn("relative", className)} onClick={onClick}>
      <AvatarImage 
        src={src} 
        alt={alt} 
        className={isSvg ? filterClass : ""} 
      />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  )
}
