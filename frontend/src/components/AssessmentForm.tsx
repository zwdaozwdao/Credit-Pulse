'use client';

import { useState, useEffect } from 'react';
import { METRICS } from '@/lib/config';

interface AssessmentInput {
  revenue: number;
  employees: number;
  years: number;
  debtRatio: number;
  cashflow: number;
  litigation: number;
}

interface AssessmentFormProps {
  onSubmit: (data: AssessmentInput) => void;
  onBack: () => void;
  onHome: () => void;
  isSubmitting: boolean;
}

// Skeleton component for loading state
function FormSkeleton() {
  return (
    <div className="container mx-auto px-6 py-12 max-w-5xl animate-pulse">
      {/* Navigation skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="h-6 w-16 bg-slate-200 rounded" />
        <div className="h-6 w-16 bg-slate-200 rounded" />
      </div>

      {/* Header skeleton */}
      <div className="mb-12 text-center space-y-4">
        <div className="h-10 w-96 bg-slate-200 rounded mx-auto" />
        <div className="h-6 w-full max-w-2xl bg-slate-100 rounded mx-auto" />
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card p-8 rounded-2xl space-y-5">
            <div className="h-6 w-40 bg-slate-200 rounded" />
            <div className="space-y-3">
              {[...Array(i < 3 ? 5 : 3)].map((_, j) => (
                <div key={j} className="h-12 w-full bg-slate-100 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Button skeleton */}
      <div className="mt-12 flex justify-center">
        <div className="h-14 w-72 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}

export function AssessmentForm({ onSubmit, onBack, onHome, isSubmitting }: AssessmentFormProps) {
  const [formData, setFormData] = useState<AssessmentInput>({
    revenue: 0,
    employees: 0,
    years: 0,
    debtRatio: 0,
    cashflow: 0,
    litigation: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial loading (for smooth transition)
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const isComplete = Object.values(formData).every(v => v !== 0);

  const handleSelect = (key: keyof AssessmentInput, value: number) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Show skeleton while loading
  if (isLoading) {
    return <FormSkeleton />;
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-5xl">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-900 hover:text-slate-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <button
          onClick={onHome}
          className="flex items-center gap-2 text-slate-900 hover:text-slate-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Home
        </button>
      </div>

      <div className="mb-12 text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-serif-display">
          Enterprise Profile Assessment
        </h2>
        <p className="text-slate-900 max-w-2xl mx-auto text-lg">
          Please select the ranges that best describe your enterprise. 
          All inputs will be encrypted locally before submission.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Object.entries(METRICS).map(([key, metric], index) => (
          <div 
            key={key} 
            className="glass-card p-8 rounded-2xl space-y-5 hover:shadow-xl transition-all duration-300"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between">
              <label className="text-lg font-semibold text-slate-800 font-serif-display">
                {metric.label}
              </label>
              {formData[key as keyof AssessmentInput] !== 0 && (
                <span className="text-emerald-500 animate-in fade-in duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {metric.options.map((option) => {
                const isSelected = formData[key as keyof AssessmentInput] === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(key as keyof AssessmentInput, option.value)}
                    disabled={isSubmitting}
                    className={`
                      relative w-full px-5 py-3 rounded-xl text-left transition-all duration-200 border
                      ${isSelected 
                        ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-[1.02]' 
                        : 'bg-white text-slate-900 border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                      }
                    `}
                  >
                    <span className="relative z-10 text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 flex justify-center sticky bottom-8 z-30">
        <div className="glass-card p-2 rounded-2xl shadow-2xl">
          <button
            onClick={() => onSubmit(formData)}
            disabled={!isComplete || isSubmitting}
            className={`
              px-12 py-4 rounded-xl font-medium text-lg shadow-lg transition-all duration-300
              ${isComplete && !isSubmitting
                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow-blue-500/30'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }
            `}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              'Encrypt & Submit Assessment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
