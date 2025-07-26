import { useState, useCallback } from 'react';

interface Toast {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastState {
  toasts: Array<Toast & { id: string; timestamp: number }>;
}

// Global toast state management
let globalToastState: ToastState = { toasts: [] };
let toastListeners: Set<(state: ToastState) => void> = new Set();

function notifyListeners() {
  toastListeners.forEach(listener => listener(globalToastState));
}

function addToast(toast: Toast) {
  const newToast = {
    ...toast,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now()
  };
  
  globalToastState = {
    toasts: [...globalToastState.toasts, newToast]
  };
  
  notifyListeners();
  
  // Auto-remove toast after 5 seconds
  setTimeout(() => {
    removeToast(newToast.id);
  }, 5000);
}

function removeToast(id: string) {
  globalToastState = {
    toasts: globalToastState.toasts.filter(toast => toast.id !== id)
  };
  notifyListeners();
}

export function useSafeToast() {
  const [, forceUpdate] = useState({});
  
  const refresh = useCallback(() => {
    forceUpdate({});
  }, []);
  
  // Subscribe to toast state changes
  useState(() => {
    toastListeners.add(refresh);
    return () => {
      toastListeners.delete(refresh);
    };
  });
  
  const toast = useCallback((toastData: Toast) => {
    try {
      addToast(toastData);
      console.log('Toast added safely:', toastData.title);
    } catch (error) {
      console.error('Toast error (fallback to console):', toastData.title, error);
    }
  }, []);
  
  return {
    toast,
    toasts: globalToastState.toasts,
    removeToast
  };
}

// Export a simple toast function for components that don't need reactive state
export function showToast(toast: Toast) {
  addToast(toast);
}