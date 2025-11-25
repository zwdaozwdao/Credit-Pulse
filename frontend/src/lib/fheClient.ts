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
        console.log('🔄 Loading @zama-fhe/relayer-sdk/web v0.3...');
        
        // Dynamic import with correct path for browser
        const { initSDK, createInstance, SepoliaConfig } = await import('@zama-fhe/relayer-sdk/web');
        
        console.log('📦 SDK loaded, SepoliaConfig:', SepoliaConfig);
        
        // Initialize SDK (TFHE WASM)
        console.log('🔄 Initializing SDK...');
        await initSDK();
        
        console.log('🔄 Creating FHEVM instance with SepoliaConfig...');
        
        // Create instance with built-in Sepolia config
        fhevmInstance = await createInstance(SepoliaConfig);
        
        console.log('✅ FHE Client initialized successfully');
      } catch (error) {
        console.error('❌ FHE init failed:', error);
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

    console.log('🔐 Creating encrypted input...');
    
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

    console.log('🔐 Encrypting...');
    const encrypted = await input.encrypt();
    
    console.log('✅ Encryption complete');

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
   * Public Decryption - for handles marked as publicly decryptable on-chain
   * Used after contract calls FHE.makePubliclyDecryptable()
   */
  async publicDecrypt(handles: string[]): Promise<Record<string, bigint | boolean | string>> {
    if (!fhevmInstance) {
      throw new Error('FHE not initialized');
    }

    console.log('🔓 Starting public decryption...');
    console.log('Handles to decrypt:', handles);
    
    const results = await fhevmInstance.publicDecrypt(handles);
    
    console.log('✅ Public decryption complete:', results);
    return results;
  },

  /**
   * User Decryption - for handles that require user signature
   * Requires EIP712 signature from the user
   */
  async userDecrypt(
    handles: Array<{ handle: string; contractAddress: string }>,
    signer: any // ethers Signer
  ): Promise<Record<string, bigint | boolean | string>> {
    if (!fhevmInstance) {
      throw new Error('FHE not initialized');
    }

    console.log('🔓 Starting user decryption...');
    
    // Generate keypair for decryption
    const { publicKey, privateKey } = fhevmInstance.generateKeypair();
    console.log('🔑 Keypair generated');
    
    // Get contract addresses from handles
    const contractAddresses = [...new Set(handles.map(h => h.contractAddress))];
    
    // Create EIP712 signature request
    const startTimestamp = Math.floor(Date.now() / 1000);
    const durationDays = 1; // Valid for 1 day
    
    const eip712 = fhevmInstance.createEIP712(
      publicKey,
      contractAddresses,
      startTimestamp,
      durationDays
    );
    
    console.log('📝 Requesting signature...');
    console.log('EIP712 data:', eip712);
    
    // Remove EIP712Domain from types (ethers.js handles it via domain)
    const { EIP712Domain, ...typesWithoutDomain } = eip712.types;
    
    // Get user signature
    const signature = await signer.signTypedData(
      eip712.domain,
      typesWithoutDomain,
      eip712.message
    );
    
    console.log('✅ Signature obtained');
    
    // Get user address
    const userAddress = await signer.getAddress();
    
    // Perform decryption
    const results = await fhevmInstance.userDecrypt(
      handles,
      privateKey,
      publicKey,
      signature,
      contractAddresses,
      userAddress,
      startTimestamp,
      durationDays
    );
    
    console.log('✅ User decryption complete:', results);
    return results;
  },

  /**
   * Decrypt assessment results (scale grade and health grade)
   * Uses public decryption if handles are marked publicly decryptable
   */
  async decryptAssessmentResults(
    scaleGradeHandle: string,
    healthGradeHandle: string
  ): Promise<{ scaleGrade: number; healthGrade: number }> {
    if (!fhevmInstance) {
      throw new Error('FHE not initialized');
    }

    console.log('🔓 Decrypting assessment results...');
    
    const results = await this.publicDecrypt([scaleGradeHandle, healthGradeHandle]);
    
    // Extract values from results
    const scaleGrade = Number(results[scaleGradeHandle] || 0);
    const healthGrade = Number(results[healthGradeHandle] || 0);
    
    console.log('✅ Decrypted - Scale:', scaleGrade, 'Health:', healthGrade);
    
    return { scaleGrade, healthGrade };
  },

  reset(): void {
    fhevmInstance = null;
    initPromise = null;
  },
};
