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
  const [result, setResult] = useState<{ scaleScore: number; healthScore: number; txHash?: string } | null>(null);
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
      
      const { fheClient } = await import('@/lib/fheClient');
      
      if (!fheClient.isReady()) {
        await fheClient.init();
      }
      
      const encrypted = await fheClient.encryptAssessment(input, address);

      // Step 2: Submit to blockchain
      setProcessingStep('submitting');
      
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

      // Step 3: Wait for transaction confirmation and on-chain FHE computation
      setProcessingStep('computing');
      
      if (!publicClient) {
        throw new Error('Public client not available');
      }
      
      // Wait for transaction receipt
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      
      // Additional wait for FHE computation to complete on-chain
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Step 4: Read encrypted handles from contract with retry
      setProcessingStep('decrypting');
      
      // Retry logic for reading handles (FHE computation may take time)
      let scaleHandle: bigint | null = null;
      let healthHandle: bigint | null = null;
      const maxRetries = 3;
      
      for (let i = 0; i < maxRetries; i++) {
        try {
          const scaleResult = await publicClient.readContract({
            address: CREDIT_PULSE_CONTRACT_ADDRESS,
            abi: CREDIT_PULSE_ABI,
            functionName: 'getScaleGrade',
            args: [address],
          });
          
          const healthResult = await publicClient.readContract({
            address: CREDIT_PULSE_CONTRACT_ADDRESS,
            abi: CREDIT_PULSE_ABI,
            functionName: 'getHealthGrade',
            args: [address],
          });
          
          // Convert to bigint safely
          scaleHandle = scaleResult !== null && scaleResult !== undefined ? BigInt(String(scaleResult)) : null;
          healthHandle = healthResult !== null && healthResult !== undefined ? BigInt(String(healthResult)) : null;
          
          // Check if we got valid handles (non-zero)
          if (scaleHandle && healthHandle && scaleHandle > BigInt(0) && healthHandle > BigInt(0)) {
            break;
          }
        } catch (readError: any) {
          console.error(`Retry ${i + 1}/${maxRetries} reading handles:`, readError?.message || readError);
        }
        
        // Wait before retry
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      // Validate handles exist
      if (!scaleHandle || !healthHandle || scaleHandle === BigInt(0) || healthHandle === BigInt(0)) {
        throw new Error(`Assessment data not ready. scaleHandle=${scaleHandle}, healthHandle=${healthHandle}`);
      }
      
      // Step 5: Decrypt using FHE SDK with user signature
      // Get ethereum provider from window
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        throw new Error('No wallet provider found');
      }
      
      // Create ethers provider and signer
      const provider = new BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      
      // Convert handles to hex strings (handles are uint256 in Solidity)
      const scaleHandleHex = `0x${scaleHandle.toString(16).padStart(64, '0')}` as `0x${string}`;
      const healthHandleHex = `0x${healthHandle.toString(16).padStart(64, '0')}` as `0x${string}`;
      
      console.log('Decrypting handles:', { scaleHandleHex, healthHandleHex });
      
      // Prepare handles for decryption
      const handles = [
        { handle: scaleHandleHex, contractAddress: CREDIT_PULSE_CONTRACT_ADDRESS },
        { handle: healthHandleHex, contractAddress: CREDIT_PULSE_CONTRACT_ADDRESS },
      ];
      
      const decryptedResults = await fheClient.userDecrypt(handles, signer);
      console.log('Decrypted results:', decryptedResults);
      
      // Extract decrypted values
      const scaleScore = Number(decryptedResults[scaleHandleHex] || 0);
      const healthScore = Number(decryptedResults[healthHandleHex] || 0);
      
      setResult({ scaleScore, healthScore, txHash });
      setState('result');

    } catch (err: any) {
      console.error('Assessment failed:', err);
      
      let errorMessage = 'Assessment failed';
      if (err.message?.includes('user rejected')) {
        errorMessage = 'Transaction cancelled';
      } else if (err.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient ETH. Get Sepolia ETH from faucet.';
      } else if (err.message?.includes('BigNumberish')) {
        errorMessage = 'Data conversion error. Please try again.';
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
          txHash={result.txHash}
        />
      ) : null;
    default:
      return <Landing onStart={handleStart} />;
  }
}
