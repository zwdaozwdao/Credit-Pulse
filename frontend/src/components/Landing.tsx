'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectWalletButton } from './ConnectWalletButton';

interface LandingProps {
  onStart: () => void;
}

export function Landing({ onStart }: LandingProps) {
  const { isConnected } = useAccount();

  // Hide scrollbar on landing page
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="flex-grow flex flex-col items-center justify-start px-6 pt-16 pb-32 relative overflow-hidden">
      {/* Decorative glow - Impressionist Touch */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-200/30 rounded-full blur-[100px] -z-10" />

      <div className="max-w-4xl w-full text-center space-y-10 relative z-10">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 border border-white/60 backdrop-blur-sm shadow-sm mx-auto">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="text-sm font-medium text-slate-900 tracking-wide">Powered by Zama FHEVM</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 leading-[1.1] font-serif-display tracking-tight">
            Credit profiling, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 italic pr-2">
              pulse
            </span>
            your privacy.
          </h1>
          <p className="text-xl md:text-2xl text-slate-900 max-w-2xl mx-auto font-light leading-relaxed">
            Enterprise-grade credit assessment powered by <span className="font-medium text-slate-900">Fully Homomorphic Encryption</span>.
          </p>
        </div>

        {/* CTA Section */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
          {isConnected ? (
            <button
              onClick={onStart}
              className="group relative px-8 py-4 bg-slate-900 text-white text-lg font-medium rounded-xl shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-white/10 to-blue-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
              <span className="relative flex items-center gap-2">
                Start Assessment
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          ) : (
            <div className="scale-110">
              <ConnectWalletButton />
            </div>
          )}
          
          <a href="#" className="flex items-center gap-2 text-slate-900 hover:text-slate-900 font-medium transition-colors border-b border-transparent hover:border-slate-900 pb-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            View Documentation
          </a>
        </div>

        {/* Features / Trust Badges */}
        <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {[
            { title: "End-to-End Encryption", desc: "Data is encrypted before it leaves your device using Zama FHEVM." },
            { title: "On-Chain Verification", desc: "Verifiable computation on Ethereum Sepolia testnet." },
            { title: "Private Results", desc: "Only you hold the keys to decrypt your credit profile." }
          ].map((feature, i) => (
            <div key={i} className="glass-card p-6 rounded-2xl hover:bg-white/80 transition-colors">
              <h3 className="text-lg font-semibold text-slate-900 mb-2 font-serif-display">{feature.title}</h3>
              <p className="text-slate-900 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
