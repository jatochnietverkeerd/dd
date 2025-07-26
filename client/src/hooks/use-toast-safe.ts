import React, { useState, useEffect } from "react";

// Fallback toast implementation that's always safe
interface ToastItem {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: string;
  action?: React.ReactNode;
  open?: boolean;
}

const toastQueue: ToastItem[] = [];

let toastId = 0;

function createSafeToast() {
  return function toast(options: {
    title?: React.ReactNode;
    description?: React.ReactNode;
    variant?: string;
    action?: React.ReactNode;
  }) {
    const id = `toast-${++toastId}`;
    const toastItem: ToastItem = { id, open: true, ...options };
    
    toastQueue.push(toastItem);
    
    // Auto-remove after delay
    setTimeout(() => {
      const index = toastQueue.findIndex(item => item.id === id);
      if (index > -1) {
        toastQueue.splice(index, 1);
      }
    }, 5000);
    
    return {
      id,
      dismiss: () => {
        const index = toastQueue.findIndex(item => item.id === id);
        if (index > -1) {
          toastQueue.splice(index, 1);
        }
      }
    };
  };
}

export function useSafeToast() {
  const [, forceUpdate] = useState({});
  
  // Force re-render when toasts change
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate({});
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  return {
    toasts: toastQueue,
    toast: createSafeToast(),
    dismiss: (toastId?: string) => {
      if (toastId) {
        const index = toastQueue.findIndex(item => item.id === toastId);
        if (index > -1) {
          toastQueue.splice(index, 1);
        }
      } else {
        toastQueue.length = 0;
      }
    }
  };
}