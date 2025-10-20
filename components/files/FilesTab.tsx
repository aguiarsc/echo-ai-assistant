"use client"

import { useState } from "react"
import { Folder } from "lucide-react"
import { cn } from "@/lib/shared/utils/cn.utils"
import { FileTreeContainer } from "./tree/FileTree"
import { FileEditor } from "./editor/FileEditor"

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
      
      {/* The editor modal is always mounted, but only visible when a file is active */}
      <FileEditor />
    </>
  )
}
