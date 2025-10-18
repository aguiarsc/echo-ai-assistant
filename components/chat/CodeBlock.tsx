"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check, Copy } from "lucide-react"
import * as React from "react"

type Props = React.HTMLAttributes<HTMLPreElement>

export const CodeBlock = ({ children, className, ...props }: Props) => {
  const textRef = React.useRef<HTMLPreElement>(null)
  const [isCopied, setIsCopied] = React.useState(false)

  const onCopy = async () => {
    if (!textRef.current) return
    
    // Extract the text content from the code block
    const text = textRef.current.textContent || ""
    
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  // Extract language from className (format: "language-{lang}")
  const language = className?.includes("language-")
    ? className.replace("language-", "").trim()
    : "text"

  return (
    <div className="relative my-4 rounded-md bg-muted">
      <div className="flex items-center justify-between px-4 py-1.5 text-xs text-muted-foreground">
        <div>{language}</div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7"
          onClick={onCopy}
        >
          {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          <span className="sr-only">Copy code</span>
        </Button>
      </div>
      <pre
        ref={textRef}
        className={cn(
          "overflow-x-auto p-4 text-sm",
          className
        )}
        {...props}
      >
        {children}
      </pre>
    </div>
  )
}
