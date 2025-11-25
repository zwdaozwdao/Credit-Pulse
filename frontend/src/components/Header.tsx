'use client';

import { useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { ConnectWalletButton } from './ConnectWalletButton';

export function Header() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/60 backdrop-blur-xl supports-[backdrop-filter]:bg-white/40">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo Area - Click to go home */}
        <a 
          href="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          title="Go to Home"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-serif font-bold text-lg shadow-md">
            C
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight font-serif-display">
            CreditPulse
          </span>
        </a>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {isConnected && (
            <button
              onClick={handleCopyAddress}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/50 border border-slate-200 text-sm text-slate-900 hover:bg-slate-200/50 hover:border-slate-300 transition-all cursor-pointer"
              title="Click to copy address"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
              {copied ? (
                <span className="text-emerald-600 font-medium">Copied!</span>
              ) : (
                <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
              )}
            </button>
          )}
          
          <ConnectWalletButton />
          
          {isConnected && (
            <button
              onClick={() => disconnect()}
              className="text-sm font-medium text-slate-900 hover:text-slate-900 transition-colors"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
