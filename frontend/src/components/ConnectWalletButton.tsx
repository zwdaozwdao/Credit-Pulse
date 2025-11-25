'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useConnect, useAccount, useChainId } from 'wagmi';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const SEPOLIA_CHAIN_ID = 11155111;

// Switch to Sepolia network using wallet API
async function switchToSepolia() {
  if (typeof window === 'undefined' || !window.ethereum) return;
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
    });
  } catch (switchError: any) {
    // Chain not added, add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
            chainName: 'Sepolia Testnet',
            nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://rpc.sepolia.org'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          }],
        });
      } catch (addError) {
        console.error('Failed to add Sepolia:', addError);
      }
    }
  }
}

// Fixed wallet list with install URLs
const WALLETS = [
  {
    id: 'metamask',
    name: 'MetaMask',
    installUrl: 'https://metamask.io/download/',
    detectProvider: () => {
      if (typeof window === 'undefined') return false;
      const ethereum = (window as any).ethereum;
      return ethereum?.isMetaMask && !ethereum?.isOKExWallet;
    },
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    installUrl: 'https://www.coinbase.com/wallet/downloads',
    detectProvider: () => {
      if (typeof window === 'undefined') return false;
      const ethereum = (window as any).ethereum;
      return ethereum?.isCoinbaseWallet || (window as any).coinbaseWalletExtension;
    },
  },
  {
    id: 'okx',
    name: 'OKX Wallet',
    installUrl: 'https://www.okx.com/web3',
    detectProvider: () => {
      if (typeof window === 'undefined') return false;
      const ethereum = (window as any).ethereum;
      return ethereum?.isOKExWallet || (window as any).okxwallet;
    },
  },
];

// Modal component using Portal
function WalletModal({ 
  isOpen, 
  onClose, 
  onConnect, 
  connectingId 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConnect: (walletId: string) => void;
  connectingId: string | null;
}) {
  const [mounted, setMounted] = useState(false);
  const [walletStates, setWalletStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
    // Detect installed wallets
    const states: Record<string, boolean> = {};
    WALLETS.forEach(wallet => {
      states[wallet.id] = wallet.detectProvider();
    });
    setWalletStates(states);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleWalletClick = (wallet: typeof WALLETS[0]) => {
    if (walletStates[wallet.id]) {
      // Wallet is installed, connect
      onConnect(wallet.id);
    } else {
      // Wallet not installed, open install page
      window.open(wallet.installUrl, '_blank');
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 99999 }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4"
        style={{ zIndex: 100000 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">Connect Wallet</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Wallet List */}
        <div className="space-y-3">
          {WALLETS.map((wallet) => {
            const isInstalled = walletStates[wallet.id];
            const isConnecting = connectingId === wallet.id;
            
            return (
              <button
                key={wallet.id}
                onClick={() => handleWalletClick(wallet)}
                disabled={isConnecting}
                className={`
                  w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200
                  ${isInstalled 
                    ? 'border-slate-200 hover:border-slate-900 hover:bg-slate-50' 
                    : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                  }
                  ${isConnecting ? 'border-blue-500 bg-blue-50' : ''}
                `}
              >
                <div className="flex-grow text-left">
                  <div className="font-semibold text-slate-900">{wallet.name}</div>
                  <div className={`text-xs ${isInstalled ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {isInstalled ? 'Installed' : 'Not Installed'}
                  </div>
                </div>
                {isConnecting ? (
                  <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : isInstalled ? (
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                ) : (
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Install
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500">
          By connecting, you agree to the Terms of Service
        </p>
      </div>
    </div>
  );

  // Use Portal to render modal at document.body level
  return createPortal(modalContent, document.body);
}

export function ConnectWalletButton() {
  const [showModal, setShowModal] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const { connect, connectors, isPending } = useConnect();
  const { isConnected } = useAccount();
  const chainId = useChainId();

  // Auto-switch to Sepolia when connected but on wrong network
  useEffect(() => {
    if (isConnected && chainId !== SEPOLIA_CHAIN_ID) {
      switchToSepolia();
    }
  }, [isConnected, chainId]);

  if (isConnected) return null;

  const handleConnect = async (walletId: string) => {
    setConnectingId(walletId);
    
    // Find the injected connector (works for all browser wallets)
    const connector = connectors.find(c => c.id === 'injected') || connectors[0];
    
    if (connector) {
      try {
        await connect({ connector });
        // Switch to Sepolia after connection
        setTimeout(() => {
          switchToSepolia();
        }, 500);
        setShowModal(false);
      } catch (error) {
        console.error('Connection failed:', error);
      }
    }
    
    setConnectingId(null);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isPending}
        className="btn-primary px-6 py-2 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Connecting...
          </span>
        ) : (
          'Connect Wallet'
        )}
      </button>

      <WalletModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConnect={handleConnect}
        connectingId={connectingId}
      />
    </>
  );
}
