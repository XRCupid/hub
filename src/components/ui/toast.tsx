import React, { useEffect, useState } from 'react';
import { Toast as ToastType } from './use-toast';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: number) => void;
}

const toastStyles: Record<string, string> = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-blue-500 text-white',
  warning: 'bg-yellow-500 text-black',
};

export const ToastComponent: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      className={`fixed p-4 rounded shadow-lg transition-all duration-300 transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${toastStyles[toast.type]} ${
        toast.position === 'top-left' ? 'top-4 left-4' :
        toast.position === 'top-right' ? 'top-4 right-4' :
        toast.position === 'bottom-left' ? 'bottom-4 left-4' :
        'bottom-4 right-4'
      }`}
    >
      <div className="flex items-center">
        <span>{toast.message}</span>
        <button
          onClick={handleDismiss}
          className="ml-4 text-lg font-bold"
          aria-label="Dismiss"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default ToastComponent;
