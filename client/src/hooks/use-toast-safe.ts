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
  // Complete fallback without any React hooks
  return {
    toasts: [],
    toast: (options: any) => {
      console.log('Toast message:', options.title || options.description);
      return { id: 'fallback', dismiss: () => {} };
    },
    dismiss: () => {}
  };
}