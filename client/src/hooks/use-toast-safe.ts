import React from "react";

// Simple toast implementation that doesn't rely on problematic hooks
interface ToastItem {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: string;
  action?: React.ReactNode;
  open?: boolean;
}

// Global toast state
let globalToasts: ToastItem[] = [];
let toastId = 0;
let listeners: Array<() => void> = [];

function notifyListeners() {
  listeners.forEach(listener => {
    try {
      listener();
    } catch (error) {
      console.error('Toast listener error:', error);
    }
  });
}

function createSafeToast() {
  return function toast(options: {
    title?: React.ReactNode;
    description?: React.ReactNode;
    variant?: string;
    action?: React.ReactNode;
  }) {
    const id = `toast-${++toastId}`;
    const toastItem: ToastItem = { id, open: true, ...options };
    
    globalToasts.push(toastItem);
    notifyListeners();
    
    // Auto-remove after delay
    setTimeout(() => {
      const index = globalToasts.findIndex(item => item.id === id);
      if (index > -1) {
        globalToasts.splice(index, 1);
        notifyListeners();
      }
    }, 5000);
    
    return {
      id,
      dismiss: () => {
        const index = globalToasts.findIndex(item => item.id === id);
        if (index > -1) {
          globalToasts.splice(index, 1);
          notifyListeners();
        }
      }
    };
  };
}

export function useSafeToast() {
  // Safe React hook usage with fallback
  const [renderCount, setRenderCount] = (typeof React !== 'undefined' && React.useState)
    ? React.useState(0)
    : [0, () => {}];

  // Safe useEffect usage
  if (typeof React !== 'undefined' && React.useEffect) {
    React.useEffect(() => {
      const listener = () => {
        if (typeof setRenderCount === 'function') {
          setRenderCount((count: number) => count + 1);
        }
      };
      
      listeners.push(listener);
      
      return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      };
    }, []);
  }
  
  return {
    toasts: globalToasts,
    toast: createSafeToast(),
    dismiss: (toastId?: string) => {
      if (toastId) {
        const index = globalToasts.findIndex(item => item.id === toastId);
        if (index > -1) {
          globalToasts.splice(index, 1);
          notifyListeners();
        }
      } else {
        globalToasts.length = 0;
        notifyListeners();
      }
    }
  };
}