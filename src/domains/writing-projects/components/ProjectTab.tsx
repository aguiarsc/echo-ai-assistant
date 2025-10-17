"use client"

import { useState } from "react"
import { Folder } from "lucide-react"
import { cn } from "@/shared/utilities/class-name-merger"
import { FileTreeContainer } from "./ProjectTree"
import { FileEditor } from "./FileEditor"

export function FilesTab({ open }: { open: boolean }) {
  return (
    <>
      {open && (
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-hidden">
            <FileTreeContainer />
          </div>
        </div>
      )}
      
      <FileEditor />
    </>
  )
}
