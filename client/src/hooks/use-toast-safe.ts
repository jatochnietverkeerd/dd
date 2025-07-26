// Completely hook-free toast implementation
interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant?: string;
}

// Console-based toast notifications (no UI components)
export function useSafeToast() {
  return {
    toasts: [], // Always empty for UI
    toast: (options: { title?: string; description?: string; variant?: string }) => {
      // Log to console instead of showing UI toast
      const message = options.title || options.description || 'Notification';
      console.log(`🔔 Toast: ${message}`);
      
      return {
        id: Date.now().toString(),
        dismiss: () => console.log('Toast dismissed')
      };
    },
    dismiss: () => console.log('All toasts dismissed')
  };
}