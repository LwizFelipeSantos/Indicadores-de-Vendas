import React from 'react';
import { Notification } from '../types';

// AlertManager configuration component removed as requested.
// Only NotificationToast remains for system messages (e.g. File Upload Success).

export const NotificationToast: React.FC<{ notifications: Notification[]; onClose: (id: string) => void }> = ({ notifications, onClose }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map(note => (
        <div key={note.id} className={`
          flex items-start gap-3 p-4 rounded-lg shadow-lg border-l-4 w-80 animate-bounce-in bg-white dark:bg-slate-800
          ${note.type === 'success' ? 'border-green-500' : note.type === 'warning' ? 'border-amber-500' : 'border-blue-500'}
        `}>
          <div className="flex-1">
            <h4 className="font-bold text-sm text-slate-800 dark:text-white">{note.title}</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300">{note.message}</p>
          </div>
          <button onClick={() => onClose(note.id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      ))}
    </div>
  );
};