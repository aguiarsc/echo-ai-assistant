/**
 * ThemeAvatar component
 * Avatar component with theme-aware styling
 */

"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/shared/utils/cn.utils"

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
