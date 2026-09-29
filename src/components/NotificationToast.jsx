import React from 'react';
import { Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { useBoard } from '../context/BoardContext';

export default function NotificationToast() {
  const { toasts } = useBoard();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className="toast"
            style={{
              borderLeftColor: isSuccess ? '#10b981' : isWarning ? '#f59e0b' : '#6366f1'
            }}
          >
            {isSuccess ? (
              <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0 }} />
            ) : isWarning ? (
              <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
            ) : (
              <Info size={18} color="#6366f1" style={{ flexShrink: 0 }} />
            )}
            <div style={{ fontSize: '13px', lineHeight: 1.4, color: '#f8fafc' }}>
              {toast.message}
            </div>
          </div>
        );
      })}
    </div>
  );
}
