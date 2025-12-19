import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-3 border-2 rounded-xl shadow-sm
            focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500
            disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500
            transition-all duration-200
            placeholder:text-gray-400
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 hover:border-gray-300'}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <span>⚠️</span> {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
