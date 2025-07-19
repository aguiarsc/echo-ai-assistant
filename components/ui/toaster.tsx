"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider as UIToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast, type ToasterToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <UIToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }: ToasterToast) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </UIToastProvider>
  )
}
