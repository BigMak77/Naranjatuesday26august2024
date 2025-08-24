import React from 'react';
import NeonForm from './NeonForm';

export interface NeonModuleFormField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select';
  value: string | number;
  onChange: (value: string | number) => void;
  required?: boolean;
  options?: string[]; // For select
  placeholder?: string;
  rows?: number; // For textarea
}

interface NeonModuleFormProps {
  title: string;
  fields: NeonModuleFormField[];
  onSubmit: (e: React.FormEvent) => void;
  error?: string | null;
  success?: boolean;
  children?: React.ReactNode;
}

export default function NeonModuleForm({ title, fields, onSubmit, error, success, children }: NeonModuleFormProps) {
  return (
    <NeonForm title={title} onSubmit={onSubmit}>
      {fields.map(field => (
        <div key={field.key} className="flex flex-col">
          <label className="block font-medium mb-1">{field.label}</label>

          {field.type === 'text' && (
            <input
              type="text"
              value={field.value}
              onChange={e => field.onChange(e.target.value)}
              className="neon-input"
              required={field.required}
              placeholder={field.placeholder}
            />
          )}

          {field.type === 'number' && (
            <input
              type="number"
              value={field.value}
              onChange={e => field.onChange(Number(e.target.value))}
              className="neon-input"
              required={field.required}
              placeholder={field.placeholder}
            />
          )}

          {field.type === 'textarea' && (
            <textarea
              value={field.value}
              onChange={e => field.onChange(e.target.value)}
              className="neon-input"
              required={field.required}
              placeholder={field.placeholder}
              rows={field.rows || 3}
            />
          )}

          {field.type === 'select' && field.options && (
            <select
              value={field.value}
              onChange={e => field.onChange(e.target.value)}
              className="neon-input"
              required={field.required}
            >
              {field.options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}
        </div>
      ))}

      {children && <div className="mt-6">{children}</div>}

      {error && <p className="neon-error mt-4">{error}</p>}
      {success && <p className="neon-success mt-4">✅ Module updated!</p>}
    </NeonForm>
  );
}
