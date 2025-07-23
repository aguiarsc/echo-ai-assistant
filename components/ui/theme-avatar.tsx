"use client"

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
  return (
    <Avatar className={cn("relative", className)} onClick={onClick}>
      <AvatarImage 
        src={src} 
        alt={alt} 
        className="filter dark:invert"
      />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  )
}
