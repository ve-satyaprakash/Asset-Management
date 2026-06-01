import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

/**
 * Single toast message.
 * Props: message, type ('success'|'error'), onClose, duration (ms, default 3500)
 */
export function Toast({ message, type = 'success', onClose, duration = 3500 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 300); }, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  const isSuccess = type === 'success';

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border min-w-[260px] max-w-sm transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      } ${
        isSuccess
          ? 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700'
          : 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-700'
      }`}
    >
      {isSuccess
        ? <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
        : <XCircle     size={18} className="text-red-500   shrink-0 mt-0.5" />
      }
      <span className={`text-sm font-medium flex-1 ${isSuccess ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
        {message}
      </span>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
        className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mt-0.5">
        <X size={14} />
      </button>
    </div>
  );
}

/**
 * Container fixed to top-right. Renders a stack of toasts.
 * Props: toasts — array of { id, message, type }
 *        onRemove(id)
 */
export function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => onRemove(t.id)} />
      ))}
    </div>
  );
}

/**
 * Hook — returns { toasts, showToast, removeToast }
 * Usage:
 *   const { toasts, showToast, removeToast } = useToast();
 *   showToast('Saved!', 'success');
 *   <ToastContainer toasts={toasts} onRemove={removeToast} />
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  function showToast(message, type = 'success') {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
  }

  function removeToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return { toasts, showToast, removeToast };
}
