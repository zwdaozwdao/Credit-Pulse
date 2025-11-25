'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, useAccount } from 'wagmi';
import { config } from '@/lib/config';
import { useState, createContext, useContext, ReactNode, useCallback, useEffect } from 'react';

const queryClient = new QueryClient();

interface FhevmContextType {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<boolean>;
}

const FhevmContext = createContext<FhevmContextType>({ 
  isReady: false, 
  isLoading: false,
  error: null,
  initialize: async () => false,
});

export function useFhevm() {
  return useContext(FhevmContext);
}

function FhevmProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isConnected } = useAccount();

  const initialize = useCallback(async (): Promise<boolean> => {
    if (isReady) return true;
    if (isLoading) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Dynamically import fheClient only when needed
      const { fheClient } = await import('@/lib/fheClient');
      await fheClient.init();
      setIsReady(true);
      return true;
    } catch (err: any) {
      console.error('FHEVM init error:', err);
      setError(err.message || 'Failed to initialize FHEVM');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isReady, isLoading]);

  // Auto-initialize FHEVM when wallet connects
  useEffect(() => {
    if (isConnected && !isReady && !isLoading && !error) {
      initialize();
    }
  }, [isConnected, isReady, isLoading, error, initialize]);

  // Reset state when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setIsReady(false);
      setIsLoading(false);
      setError(null);
    }
  }, [isConnected]);

  return (
    <FhevmContext.Provider value={{ isReady, isLoading, error, initialize }}>
      {children}
    </FhevmContext.Provider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <FhevmProvider>
          {children}
        </FhevmProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
