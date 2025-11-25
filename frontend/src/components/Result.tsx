'use client';

import { useState } from 'react';
import { getScaleGrade, getHealthGrade, getLoanRecommendation } from '@/lib/config';

interface ResultProps {
  scaleScore: number;
  healthScore: number;
  onReset: () => void;
  txHash?: string;
}

// Shorten hash for display
function shortenHash(hash: string): string {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

// Generate treatment plan based on scores
function getTreatmentPlan(scaleGrade: string, healthGrade: string): { scale: string; health: string } {
  const scalePlan: Record<string, string> = {
    'S': 'Maintain current enterprise scale',
    'M': 'Scale up revenue to $10M+ for Large tier',
    'L': 'Excellent scale, consider expansion',
    'XL': 'Enterprise-level scale achieved'
  };
  
  const healthPlan: Record<string, string> = {
    'A': 'No action needed',
    'B': 'Minor improvements recommended',
    'C': 'Focus on reducing debt ratio',
    'D': 'Priority: Improve cash flow and resolve litigations'
  };
  
  return {
    scale: scalePlan[scaleGrade] || 'Evaluate growth opportunities',
    health: healthPlan[healthGrade] || 'Review financial metrics'
  };
}

export function Result({ scaleScore, healthScore, onReset, txHash }: ResultProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const scale = getScaleGrade(scaleScore);
  const health = getHealthGrade(healthScore);
  const loan = getLoanRecommendation(scale.grade, health.grade);
  const treatmentPlan = getTreatmentPlan(scale.grade, health.grade);
  const txUrl = txHash ? `https://sepolia.etherscan.io/tx/${txHash}` : null;

  return (
    <div className="flex-grow flex items-center justify-center px-6 py-4">
      <div className="glass-card w-full max-w-3xl p-8 md:p-10 rounded-2xl shadow-2xl relative border-t-4 border-t-slate-900">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 font-serif-display">Credit Pulse Report</h2>
            <p className="text-slate-900 text-sm uppercase tracking-wider mt-1">Confidential & Verified</p>
          </div>
          <div 
            className="relative inline-block"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <div className="px-4 py-1.5 bg-gradient-to-r from-slate-100 to-blue-50 rounded-full text-sm font-semibold text-slate-900 uppercase tracking-widest cursor-help hover:from-slate-200 hover:to-blue-100 transition-all duration-300">
              Result
            </div>
            {/* Tooltip - positioned to the right */}
            <div className={`absolute top-0 left-full ml-4 w-72 bg-white/95 backdrop-blur-md text-slate-900 p-5 rounded-2xl shadow-xl border border-slate-200/60 z-50 transition-all duration-300 ease-out origin-left ${
              showTooltip 
                ? 'opacity-100 translate-x-0 scale-100' 
                : 'opacity-0 -translate-x-2 scale-95 pointer-events-none'
            }`}>
              <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Treatment Plan
              </div>
              <div className="space-y-3 text-sm">
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                  <div className="text-blue-600/80 font-medium mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60"></span>
                    Scale Strategy
                  </div>
                  <div className="text-slate-900 leading-relaxed">{treatmentPlan.scale}</div>
                </div>
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                  <div className="text-emerald-600/80 font-medium mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60"></span>
                    Health Metrics
                  </div>
                  <div className="text-slate-900 leading-relaxed">{treatmentPlan.health}</div>
                </div>
              </div>
              {/* Arrow pointing left */}
              <div className="absolute top-4 -left-2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-white/95"></div>
            </div>
          </div>
        </div>

        {/* Scores Grid */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          
          {/* Scale Score */}
          <div className="bg-slate-50 p-8 rounded-xl border border-slate-100 text-center">
            <h3 className="text-slate-900 text-sm font-medium uppercase tracking-widest mb-4">Enterprise Scale</h3>
            <div className="text-5xl font-bold text-slate-900 font-serif-display">{scale.grade}</div>
            <div className="text-blue-600 font-medium text-base mt-2">{scale.label}</div>
            <div className="mt-4 text-sm text-slate-900">Score: {scaleScore} / 14</div>
          </div>

          {/* Health Score */}
          <div className="bg-slate-50 p-8 rounded-xl border border-slate-100 text-center">
            <h3 className="text-slate-900 text-sm font-medium uppercase tracking-widest mb-4">Financial Health</h3>
            <div className={`text-5xl font-bold font-serif-display ${
              health.grade === 'A' ? 'text-emerald-600' :
              health.grade === 'B' ? 'text-blue-600' :
              health.grade === 'C' ? 'text-amber-500' : 'text-rose-500'
            }`}>
              {health.grade}
            </div>
            <div className="text-slate-900 font-medium text-base mt-2">{health.label}</div>
            <div className="mt-4 text-sm text-slate-900">Score: {healthScore} / 11</div>
          </div>

        </div>

        {/* Loan Recommendation Section */}
        <div className="bg-slate-900 text-white p-8 rounded-xl shadow-xl mb-8">
          <h3 className="text-base font-medium text-slate-300 mb-4 font-serif-display border-b border-slate-700 pb-2">
            Loan Eligibility Analysis
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Max Amount</div>
              <div className="text-xl font-bold text-white">{loan.amount}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Interest Rate</div>
              <div className="text-xl font-bold text-white">{loan.rate}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Approval</div>
              <div className="text-xl font-bold text-emerald-400">{loan.speed}</div>
            </div>
          </div>
        </div>

        {/* Transaction Hash */}
        {txHash && txUrl && (
          <div className="flex items-center justify-center gap-3 mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 text-sm uppercase tracking-wider font-medium">TX Hash</span>
            <a
              href={txUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-mono text-sm bg-white px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors"
            >
              {shortenHash(txHash)}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white font-medium text-base rounded-xl hover:bg-slate-800 transition-colors shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            New Assessment
          </button>
          <a
            href="/"
            className="flex items-center gap-2 px-8 py-3 bg-white border border-slate-200 text-slate-900 font-medium text-base rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </a>
        </div>

      </div>
    </div>
  );
}
