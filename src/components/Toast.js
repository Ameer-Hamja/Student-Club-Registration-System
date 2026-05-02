import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

/**
 * Toast notification component.
 * Usage: <Toast message="..." type="success|error|warning" onClose={() => {}} />
 */
const ICONS = {
  success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
  error:   <XCircle    className="w-5 h-5 text-red-400" />,
  warning: <AlertCircle className="w-5 h-5 text-amber-400" />,
};

const BG = {
  success: 'border-emerald-500/40 bg-emerald-500/10',
  error:   'border-red-500/40 bg-red-500/10',
  warning: 'border-amber-500/40 bg-amber-500/10',
};

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 300); }, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-xl
                  transition-all duration-300 ${BG[type]}
                  ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
    >
      {ICONS[type]}
      <p className="text-white text-sm flex-1">{message}</p>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
        className="text-white/40 hover:text-white transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// ── Toast Container ────────────────────────────────────────────────────────────
export const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full">
    {toasts.map(t => (
      <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
    ))}
  </div>
);

// ── useToast hook ──────────────────────────────────────────────────────────────
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return { toasts, addToast, removeToast };
};

export default Toast;
