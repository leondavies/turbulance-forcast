'use client'

import { useState, useRef, useEffect } from 'react'

interface Option {
  value: string
  label: string
}

interface AutocompleteProps {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  onSearch: (query: string) => Promise<Option[]>
  required?: boolean
  icon?: string
}

export function Autocomplete({
  label,
  placeholder,
  value,
  onChange,
  onSearch,
  required = false,
  icon = '🔍',
}: AutocompleteProps) {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<Option[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search airports as user types
  useEffect(() => {
    const searchAirports = async () => {
      if (query.length < 2) {
        setOptions([])
        return
      }

      setIsLoading(true)
      try {
        const results = await onSearch(query)
        setOptions(results)
        setIsOpen(true)
      } catch (error) {
        console.error('Search error:', error)
        setOptions([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchAirports, 300)
    return () => clearTimeout(debounceTimer)
  }, [query, onSearch])

  const handleSelect = (option: Option) => {
    setQuery(option.label)
    onChange(option.value)
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || options.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev < options.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      handleSelect(options[selectedIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setSelectedIndex(-1)
    }
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl pointer-events-none">
          {icon}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (!e.target.value) onChange('')
          }}
          onFocus={() => {
            if (options.length > 0) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-200 rounded-2xl shadow-sm
                     focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                     transition-all duration-200 bg-white/80 backdrop-blur-sm
                     placeholder:text-gray-400"
        />

        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && options.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100
                        max-h-80 overflow-y-auto animate-slide-up">
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option)}
              className={`w-full px-5 py-4 text-left transition-colors duration-150
                         hover:bg-blue-50 border-b border-gray-50 last:border-b-0
                         ${index === selectedIndex ? 'bg-blue-50' : ''}
                         ${index === 0 ? 'rounded-t-2xl' : ''}
                         ${index === options.length - 1 ? 'rounded-b-2xl' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">✈️</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {option.label.split(' - ')[0]}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {option.label.split(' - ').slice(1).join(' - ')}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && options.length === 0 && query.length >= 2 && !isLoading && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 text-center">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-gray-500 text-sm">No airports found</p>
        </div>
      )}
    </div>
  )
}
