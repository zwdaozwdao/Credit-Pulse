'use client';

import { CREDIT_PULSE_CONTRACT_ADDRESS } from './config';

// Singleton instance
let fhevmInstance: any = null;
let initPromise: Promise<void> | null = null;

/**
 * FHE Client - Real FHEVM v0.9 implementation using @zama-fhe/relayer-sdk
 * Using built-in SepoliaConfig from SDK
 */
export const fheClient = {
  async init(): Promise<void> {
    if (fhevmInstance) return;
    
    if (initPromise) {
      await initPromise;
      return;
    }

    initPromise = (async () => {
      try {
        // Dynamic import with correct path for browser
        const { initSDK, createInstance, SepoliaConfig } = await import('@zama-fhe/relayer-sdk/web');
        
        // Initialize SDK (TFHE WASM)
        await initSDK();
        
        // Create instance with built-in Sepolia config
        fhevmInstance = await createInstance(SepoliaConfig);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('FHE init failed:', error);
        }
        initPromise = null;
        throw error;
      }
    })();

    await initPromise;
  },

  isReady(): boolean {
    return fhevmInstance !== null;
  },

  getInstance(): any {
    return fhevmInstance;
  },

  async encryptAssessment(
    data: {
      revenue: number;
      employees: number;
      years: number;
      debtRatio: number;
      cashflow: number;
      litigation: number;
    },
    userAddress: string
  ) {
    if (!fhevmInstance) {
      throw new Error('FHE not initialized');
    }
    
    const input = fhevmInstance.createEncryptedInput(
      CREDIT_PULSE_CONTRACT_ADDRESS,
      userAddress
    );
    
    // Add all 6 metrics as uint8
    input.add8(data.revenue);
    input.add8(data.employees);
    input.add8(data.years);
    input.add8(data.debtRatio);
    input.add8(data.cashflow);
    input.add8(data.litigation);

    const encrypted = await input.encrypt();

    return {
      encRevenue: encrypted.handles[0],
      encEmployees: encrypted.handles[1],
      encYears: encrypted.handles[2],
      encDebtRatio: encrypted.handles[3],
      encCashflow: encrypted.handles[4],
      encLitigation: encrypted.handles[5],
      inputProof: encrypted.inputProof,
    };
  },

  /**
   * User Decryption - decrypt handles using EIP712 signature
   * This is required when contract uses FHE.allow() instead of FHE.makePubliclyDecryptable()
   */
  async userDecrypt(
    handles: Array<{ handle: string; contractAddress: string }>,
    signer: any // ethers Signer
  ): Promise<Record<string, bigint | boolean | string>> {
    if (!fhevmInstance) {
      throw new Error('FHE not initialized');
    }
    
    // Generate keypair for decryption
    const { publicKey, privateKey } = fhevmInstance.generateKeypair();
    
    // Get contract addresses from handles
    const contractAddresses = [...new Set(handles.map(h => h.contractAddress))];
    
    // Get user address
    const userAddress = await signer.getAddress();
    
    // Create EIP712 signature request
    const eip712 = fhevmInstance.createEIP712(
      publicKey,
      contractAddresses,
      userAddress
    );
    
    // Remove EIP712Domain from types (ethers.js handles it via domain)
    const { EIP712Domain, ...typesWithoutDomain } = eip712.types;
    
    // Get user signature
    const signature = await signer.signTypedData(
      eip712.domain,
      typesWithoutDomain,
      eip712.message
    );
    
    // Perform decryption - pass handles as array of handle strings
    const handleStrings = handles.map(h => h.handle);
    const results = await fhevmInstance.userDecrypt(
      handleStrings,
      privateKey,
      publicKey,
      signature,
      contractAddresses,
      userAddress
    );
    
    // Map results back to original handle keys
    const mappedResults: Record<string, bigint | boolean | string> = {};
    for (const h of handles) {
      if (results[h.handle] !== undefined) {
        mappedResults[h.handle] = results[h.handle];
      }
    }
    
    return mappedResults;
  },

  reset(): void {
    fhevmInstance = null;
    initPromise = null;
  },
};
