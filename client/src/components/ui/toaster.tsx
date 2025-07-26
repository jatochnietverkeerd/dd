import { useSafeToast as useToast } from "@/hooks/use-toast-safe"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  // Return empty div - no toast UI needed
  return <div className="hidden" />;
}
