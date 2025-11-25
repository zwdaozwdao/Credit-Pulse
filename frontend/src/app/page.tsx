'use client';

import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { Landing } from '@/components/Landing';
import { AssessmentForm } from '@/components/AssessmentForm';
import { Processing } from '@/components/Processing';
import { Result } from '@/components/Result';
import { useFhevm } from './providers';
import { CREDIT_PULSE_CONTRACT_ADDRESS, CREDIT_PULSE_ABI } from '@/lib/config';
import { sepolia } from 'wagmi/chains';
import { BrowserProvider } from 'ethers';

type AppState = 'landing' | 'form' | 'processing' | 'result' | 'loading-fhe';
type ProcessingStep = 'encrypting' | 'submitting' | 'computing' | 'decrypting';

interface AssessmentInput {
  revenue: number;
  employees: number;
  years: number;
  debtRatio: number;
  cashflow: number;
  litigation: number;
}

export default function Home() {
  const [state, setState] = useState<AppState>('landing');
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('encrypting');
  const [result, setResult] = useState<{ scaleScore: number; healthScore: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { address, isConnected, chain } = useAccount();
  const { isReady: fhevmReady, isLoading: fhevmLoading, initialize: initFhevm } = useFhevm();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const handleStart = useCallback(async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }
    if (chain?.id !== sepolia.id) {
      setError('Please switch to Sepolia network');
      return;
    }
    
    // Initialize FHE if not ready
    if (!fhevmReady) {
      setState('loading-fhe');
      const success = await initFhevm();
      if (!success) {
        setError('Failed to initialize FHE encryption. Please refresh and try again.');
        setState('landing');
        return;
      }
    }
    
    setError(null);
    setState('form');
  }, [isConnected, chain, fhevmReady, initFhevm]);

  const handleSubmit = useCallback(async (input: AssessmentInput) => {
    if (!address) {
      setError('Wallet not connected');
      return;
    }

    setError(null);
    setState('processing');

    try {
      // Step 1: FHE Encrypt
      setProcessingStep('encrypting');
      console.log('🔐 Encrypting with FHE...');
      
      const { fheClient } = await import('@/lib/fheClient');
      
      if (!fheClient.isReady()) {
        await fheClient.init();
      }
      
      const encrypted = await fheClient.encryptAssessment(input, address);
      console.log('✅ FHE Encryption complete');

      // Step 2: Submit to blockchain
      setProcessingStep('submitting');
      console.log('📤 Submitting to blockchain...');
      
      const toHex = (arr: Uint8Array): `0x${string}` => {
        return `0x${Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')}`;
      };
      
      const txHash = await writeContractAsync({
        address: CREDIT_PULSE_CONTRACT_ADDRESS,
        abi: CREDIT_PULSE_ABI,
        functionName: 'submitAssessment',
        args: [
          toHex(encrypted.encRevenue),
          toHex(encrypted.encEmployees),
          toHex(encrypted.encYears),
          toHex(encrypted.encDebtRatio),
          toHex(encrypted.encCashflow),
          toHex(encrypted.encLitigation),
          toHex(encrypted.inputProof),
        ],
      });
      
      console.log('✅ TX:', txHash);

      // Step 3: Wait for transaction confirmation and on-chain FHE computation
      setProcessingStep('computing');
      console.log('⏳ Waiting for transaction confirmation...');
      
      // Wait for transaction receipt
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash });
        console.log('✅ Transaction confirmed');
      }
      
      // Additional wait for FHE computation to complete on-chain
      console.log('⏳ Waiting for on-chain FHE computation...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Step 4: Read encrypted handles from contract
      setProcessingStep('decrypting');
      console.log('🔓 Reading encrypted results from contract...');
      
      // Read the encrypted handles from contract
      const scaleHandle = await publicClient?.readContract({
        address: CREDIT_PULSE_CONTRACT_ADDRESS,
        abi: CREDIT_PULSE_ABI,
        functionName: 'getScaleGrade',
        args: [address],
      });
      
      const healthHandle = await publicClient?.readContract({
        address: CREDIT_PULSE_CONTRACT_ADDRESS,
        abi: CREDIT_PULSE_ABI,
        functionName: 'getHealthGrade',
        args: [address],
      });
      
      console.log('📦 Encrypted handles:', { scaleHandle, healthHandle });
      
      // Step 5: Decrypt using FHE SDK with user signature
      console.log('🔓 Decrypting with user signature...');
      
      // Get ethereum provider from window
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        throw new Error('No wallet provider found');
      }
      
      // Create ethers provider and signer
      const provider = new BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      
      // Prepare handles for decryption
      const handles = [
        { handle: `0x${BigInt(scaleHandle as bigint).toString(16).padStart(64, '0')}`, contractAddress: CREDIT_PULSE_CONTRACT_ADDRESS },
        { handle: `0x${BigInt(healthHandle as bigint).toString(16).padStart(64, '0')}`, contractAddress: CREDIT_PULSE_CONTRACT_ADDRESS },
      ];
      
      console.log('🔐 Requesting decryption signature...');
      const decryptedResults = await fheClient.userDecrypt(handles, signer);
      
      // Extract decrypted values
      const scaleScore = Number(decryptedResults[handles[0].handle] || 0);
      const healthScore = Number(decryptedResults[handles[1].handle] || 0);

      console.log('✅ Decrypted results:', { scaleScore, healthScore });
      
      setResult({ scaleScore, healthScore });
      setState('result');

    } catch (err: any) {
      console.error('❌ Failed:', err);
      
      let errorMessage = 'Assessment failed';
      if (err.message?.includes('user rejected')) {
        errorMessage = 'Transaction cancelled';
      } else if (err.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient ETH. Get Sepolia ETH from faucet.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setState('form');
    }
  }, [address, writeContractAsync]);

  const handleReset = useCallback(() => {
    setResult(null);
    setError(null);
    setState('landing');
  }, []);

  // Go back to previous page
  const handleBack = useCallback(() => {
    if (state === 'form') {
      setState('landing');
    } else if (state === 'result') {
      setState('form');
    }
  }, [state]);

  // Loading FHE screen
  if (state === 'loading-fhe') {
  return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400/20 to-cyan-500/20 flex items-center justify-center border border-emerald-500/30 animate-pulse">
            <span className="text-4xl">🔐</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Loading FHE Encryption</h2>
          <p className="text-slate-400">Initializing secure computation environment...</p>
          <p className="text-slate-500 text-sm mt-2">This may take 10-30 seconds</p>
        </div>
      </div>
    );
  }

  // Error display
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-red-500/10 border border-red-500/30 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setState('landing');
            }}
            className="px-6 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
    </div>
  );
  }

  switch (state) {
    case 'landing':
      return <Landing onStart={handleStart} />;
    case 'form':
      return <AssessmentForm onSubmit={handleSubmit} onBack={handleBack} onHome={handleReset} isSubmitting={false} />;
    case 'processing':
      return <Processing step={processingStep} onBack={handleBack} onHome={handleReset} />;
    case 'result':
      return result ? (
        <Result
          scaleScore={result.scaleScore}
          healthScore={result.healthScore}
          onReset={handleReset}
        />
      ) : null;
    default:
      return <Landing onStart={handleStart} />;
  }
}
