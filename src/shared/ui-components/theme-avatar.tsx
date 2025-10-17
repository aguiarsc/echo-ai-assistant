"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui-components/avatar"
import { cn } from "@/shared/utilities/class-name-merger"

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
        className="object-cover"
      />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  )
}
