'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, MapPin, AlertCircle } from 'lucide-react';

interface LocationSearchProps {
  onSelect: (lat: number, lng: number, displayName: string) => void;
}

interface SearchResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
}

export default function LocationSearch({ onSelect }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=lk&limit=5`,
          { 
            headers: { 
              'Accept-Language': 'en',
              'Accept': 'application/json'
            } 
          }
        );
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json() as SearchResult[];
        console.log("API RESULT:", data);
        setResults(data);
        setShowDropdown(true);
      } catch (err) {
        setError('Search unavailable');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    setQuery(result.display_name); // keep it populated or clear it, either is fine. 
    setShowDropdown(false);
    onSelect(parseFloat(result.lat), parseFloat(result.lon), result.display_name);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative flex items-center">
        <Search className="w-5 h-5 text-gray-400 absolute left-4" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => {
            if (query.trim() && results.length > 0) setShowDropdown(true);
          }}
          placeholder="Search location, shop, or landmark..."
          className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition text-sm text-gray-800"
        />
        {loading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin absolute right-4" />}
      </div>
      
      {showDropdown && query.trim().length > 0 && (
        <div className="absolute z-[1000] w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
          {error ? (
            <div className="px-4 py-3 text-sm text-red-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="px-4 py-3 text-sm text-gray-500">No locations found</div>
          ) : (
            results.map((result) => {
              const parts = result.display_name.split(',');
              const mainText = parts[0].trim();
              const subText = parts.slice(1).join(',').trim();
              return (
                <button
                  key={result.place_id}
                  type="button"
                  onClick={() => handleSelect(result)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3 border-b border-gray-50 last:border-0 transition"
                >
                  <MapPin className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800 leading-tight">
                      {mainText}
                    </span>
                    {subText && (
                      <span className="text-xs text-gray-500 mt-0.5 leading-tight">
                        {subText}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
