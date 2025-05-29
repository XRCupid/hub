import { useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface Toast extends ToastOptions {
  id: number;
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const showToast = useCallback((message: string, type: ToastType = 'info', options: ToastOptions = {}) => {
    const id = Date.now();
    const toast: Toast = {
      id,
      message,
      type,
      ...options
    };
    
    setToasts(prev => [...prev, toast]);
    
    // Auto-dismiss
    const duration = options.duration || 3000;
    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
    
    return id;
  }, []);
  
  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  const toast = {
    success: (message: string, options?: ToastOptions) => showToast(message, 'success', options),
    error: (message: string, options?: ToastOptions) => showToast(message, 'error', options),
    info: (message: string, options?: ToastOptions) => showToast(message, 'info', options),
    warning: (message: string, options?: ToastOptions) => showToast(message, 'warning', options),
    dismiss: dismissToast,
  };
  
  return { toasts, toast, dismissToast };
}

export default useToast;
