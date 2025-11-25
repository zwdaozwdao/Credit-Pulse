'use client';

import { useAccount } from 'wagmi';
import { useFhevm } from '@/app/providers';
import { sepolia } from 'wagmi/chains';
import { CREDIT_PULSE_CONTRACT_ADDRESS } from '@/lib/config';

// Shorten address for display
function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function StatusBar() {
  const { isConnected, chain } = useAccount();
  const { isReady, isLoading, error } = useFhevm();

  const isSepolia = chain?.id === sepolia.id;
  const contractUrl = `https://sepolia.etherscan.io/address/${CREDIT_PULSE_CONTRACT_ADDRESS}`;

  // Calculate FHEVM status
  const getFhevmStatus = () => {
    if (!isConnected) {
      return { label: 'Idle', color: 'text-slate-900', bg: '', dot: '' };
    }
    if (isLoading) {
      return { label: 'Initializing', color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500 animate-pulse' };
    }
    if (error) {
      return { label: 'Error', color: 'text-rose-700', bg: 'bg-rose-50', dot: 'bg-rose-500' };
    }
    if (isReady) {
      return { label: 'Ready', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' };
    }
    return { label: 'Idle', color: 'text-slate-400', bg: '', dot: '' };
  };

  const fhevmStatus = getFhevmStatus();

  return (
    <div className="fixed bottom-0 w-full bg-white/80 backdrop-blur-md border-t border-white/50 py-2 px-6 z-40 text-xs">
        <div className="container mx-auto flex items-center justify-between text-slate-900">
        
        <div className="flex items-center gap-6">
          {/* FHE Status */}
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider font-semibold">FHEVM</span>
            {fhevmStatus.bg ? (
              <span className={`flex items-center gap-1.5 ${fhevmStatus.color} ${fhevmStatus.bg} px-2 py-0.5 rounded-full`}>
                <span className={`w-1.5 h-1.5 rounded-full ${fhevmStatus.dot}`} />
                {fhevmStatus.label}
              </span>
            ) : (
              <span className={fhevmStatus.color}>{fhevmStatus.label}</span>
            )}
          </div>

          {/* Network Status */}
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider font-semibold">Network</span>
            {!isConnected ? (
              <span className="text-slate-900">Not Connected</span>
            ) : isSepolia ? (
              <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Sepolia
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                 <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                 Wrong Network
              </span>
            )}
          </div>

          {/* Contract Address */}
          <div className="flex items-center gap-2">
            <span className="uppercase tracking-wider font-semibold">Contract</span>
            <a 
              href={contractUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full hover:bg-violet-100 transition-colors cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              {shortenAddress(CREDIT_PULSE_CONTRACT_ADDRESS)}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        <div className="hidden md:block opacity-60">
          Zama FHEVM Protocol v0.3
        </div>
      </div>
    </div>
  );
}
