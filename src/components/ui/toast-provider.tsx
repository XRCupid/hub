import React, { createContext, useContext, useRef, ReactNode } from 'react';
import useToast, { Toast, ToastOptions } from './use-toast';
import ToastComponent from './toast';

interface ToastContextType {
  toast: {
    success: (message: string, options?: ToastOptions) => number;
    error: (message: string, options?: ToastOptions) => number;
    info: (message: string, options?: ToastOptions) => number;
    warning: (message: string, options?: ToastOptions) => number;
    dismiss: (id: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toasts, toast, dismissToast } = useToast();
  
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed z-50">
        {toasts.map((toast) => (
          <ToastComponent
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};

export default ToastProvider;
