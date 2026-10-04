import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ icon: Icon = Inbox, title, description, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-fadeIn">
    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
      <Icon className="w-8 h-8" />
    </div>
    <h3 className="text-base font-semibold text-slate-800 mb-1.5">{title}</h3>
    {description && <p className="text-sm text-slate-500 max-w-sm mb-5">{description}</p>}
    {action}
  </div>
);

export default EmptyState;
