"use client"

import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

// Create unique ids so we can allow duplicates
let count = 0
function createUniqueId() {
  return (count++).toString()
}

type ToastActionType = "ADD" | "UPDATE" | "DISMISS" | "REMOVE"

interface State {
  toasts: ToasterToast[]
}

type ToastContextValue = {
  toasts: ToasterToast[]
  toast: (props: Omit<ToasterToast, "id">) => string
  dismiss: (toastId?: string) => void
  update: (id: string, props: Partial<ToasterToast>) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(
  undefined
)

function useToastReducer() {
  const [state, setState] = React.useState<State>({
    toasts: [],
  })

  const timeoutsRef = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  )

  function dismiss(toastId?: string) {
    setState((prevState) => {
      const updatedToasts = prevState.toasts.map((toast) => {
        if (toastId === undefined || toast.id === toastId) {
          // Schedule removal
          if (!timeoutsRef.current.has(toast.id)) {
            const timeout = setTimeout(() => {
              remove(toast.id)
            }, TOAST_REMOVE_DELAY)
            timeoutsRef.current.set(toast.id, timeout)
          }
          // Mark as closing
          return { ...toast, open: false }
        }
        return toast
      })

      return {
        ...prevState,
        toasts: updatedToasts,
      }
    })
  }

  function remove(toastId?: string) {
    if (toastId) {
      // Clear timeout if it exists
      const timeout = timeoutsRef.current.get(toastId)
      if (timeout) {
        clearTimeout(timeout)
        timeoutsRef.current.delete(toastId)
      }
    }

    setState((prevState) => {
      if (toastId === undefined) {
        timeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
        timeoutsRef.current.clear()
        return { ...prevState, toasts: [] }
      }
      
      return {
        ...prevState,
        toasts: prevState.toasts.filter((toast) => toast.id !== toastId),
      }
    })
  }
  
  function add(toast: Omit<ToasterToast, "id">) {
    const id = createUniqueId()
    
    setState((prevState) => {
      const newToast = {
        ...toast,
        id,
        open: true,
        onOpenChange: (open: boolean) => {
          if (!open) dismiss(id)
        },
      }
      
      return {
        ...prevState,
        toasts: [newToast, ...prevState.toasts].slice(0, TOAST_LIMIT),
      }
    })
    
    return id
  }
  
  function update(id: string, toast: Partial<ToasterToast>) {
    setState((prevState) => {
      const updatedToasts = prevState.toasts.map((t) =>
        t.id === id ? { ...t, ...toast } : t
      )
      
      return {
        ...prevState,
        toasts: updatedToasts,
      }
    })
  }

  // Clear all timeouts when component unmounts
  React.useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
      timeoutsRef.current.clear()
    }
  }, [])

  return {
    toasts: state.toasts,
    add,
    dismiss,
    remove,
    update,
  }
}

export function ToastProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { toasts, add, dismiss, remove, update } = useToastReducer()

  const contextValue = React.useMemo(
    () => ({
      toasts,
      toast: (props: Omit<ToasterToast, "id">) => add(props),
      dismiss,
      update,
    }),
    [toasts, add, dismiss, update]
  )

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  
  return context
}

export type { ToasterToast }
