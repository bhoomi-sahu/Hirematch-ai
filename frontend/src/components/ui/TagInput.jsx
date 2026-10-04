import React, { useState } from 'react';
import { X } from 'lucide-react';

const TagInput = ({ label, values = [], onChange, placeholder = 'Type and press Enter', variant = 'blue' }) => {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInput('');
  };

  const removeTag = (tag) => onChange(values.filter((v) => v !== tag));

  return (
    <div>
      {label && <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{label}</label>}
      <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500 transition-shadow">
        {values.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-900">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addTag();
            } else if (e.key === 'Backspace' && !input && values.length > 0) {
              removeTag(values[values.length - 1]);
            }
          }}
          onBlur={addTag}
          placeholder={values.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] text-sm outline-none py-1 px-1"
        />
      </div>
    </div>
  );
};

export default TagInput;
