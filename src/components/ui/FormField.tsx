import React from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'number' | 'email' | 'tel' | 'password' | 'select' | 'textarea';
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  options?: { value: string | number; label: string }[];
  min?: number | string;
  max?: number | string;
  step?: string;
  rows?: number;
  className?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  type = 'text',
  value,
  defaultValue,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  helpText,
  options = [],
  min,
  max,
  step,
  rows = 3,
  className = '',
  prefix,
  suffix
}) => {
  const baseInputClasses = `w-full rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/20 disabled:bg-neutral-100 disabled:cursor-not-allowed ${
    error
      ? 'border-[#E53935] focus:border-[#E53935] bg-rose-50/30 text-[#212121]'
      : 'border-neutral-300 focus:border-[#2E7D32] bg-white text-[#212121]'
  } ${prefix ? 'pl-9' : 'px-3.5'} ${suffix ? 'pr-9' : 'px-3.5'} py-2`;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-xs font-semibold text-neutral-700 flex items-center justify-between">
        <span>
          {label}
          {required && <span className="text-[#E53935] ml-1">*</span>}
        </span>
      </label>

      <div className="relative flex items-center">
        {prefix && (
          <div className="absolute left-3 flex items-center pointer-events-none text-neutral-400">
            {prefix}
          </div>
        )}

        {type === 'select' ? (
          <select
            id={id}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className={`${baseInputClasses} appearance-none cursor-pointer pr-8 bg-no-repeat bg-[right_0.75rem_center]`}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            id={id}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            className={`${baseInputClasses} resize-none`}
          />
        ) : (
          <input
            id={id}
            type={type}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            className={baseInputClasses}
          />
        )}

        {suffix && (
          <div className="absolute right-3 flex items-center pointer-events-none text-neutral-400 text-xs font-medium">
            {suffix}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-[11px] font-medium text-[#E53935] flex items-center gap-1 mt-0.5">
          <span>•</span> {error}
        </p>
      ) : helpText ? (
        <p className="text-[11px] text-neutral-500 mt-0.5">{helpText}</p>
      ) : null}
    </div>
  );
};
