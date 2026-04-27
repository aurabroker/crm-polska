import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

// Stub resizable components to avoid version mismatch errors
const ResizablePanelGroup = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex h-full w-full", className)} {...props} />
)
const ResizablePanel = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex-1", className)} {...props} />
)
const ResizableHandle = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex w-px items-center justify-center bg-border", className)} {...props}>
    <GripVertical className="h-4 w-4" />
  </div>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
