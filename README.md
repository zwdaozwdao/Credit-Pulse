# CreditPulse

> Enterprise Credit Privacy Rating — On-chain credit profiling powered by Fully Homomorphic Encryption (FHE)

[![Zama FHEVM](https://img.shields.io/badge/Powered%20by-Zama%20FHEVM-blue)](https://docs.zama.ai/fhevm)
[![Ethereum Sepolia](https://img.shields.io/badge/Network-Sepolia-purple)](https://sepolia.etherscan.io)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 🎯 What is CreditPulse?

CreditPulse is a privacy-first enterprise credit assessment tool that enables businesses to receive credit ratings **without exposing their sensitive financial data**.

**One-sentence summary:**  
User selects enterprise metrics → Frontend encrypts with FHE → Smart contract computes on ciphertext → User decrypts to view credit profile (Scale Grade + Health Grade + Loan Recommendations)

---

## 🔐 Why FHE?

Traditional credit assessments require enterprises to share sensitive data (revenue, debt ratio, litigation status) with third parties, creating significant privacy and security risks.

**The Problem:**
- Enterprises must expose confidential financial metrics
- Data breaches can leak competitive intelligence
- No way to verify computation without seeing the data

**The FHE Solution:**
- All inputs are encrypted **before leaving the user's device**
- Smart contracts compute credit scores **directly on encrypted data**
- Only the user can decrypt their results with their wallet signature
- Zero data exposure throughout the entire process

---

## 👤 User Flow

1. **Connect Wallet** — Connect MetaMask on Sepolia network
2. **Select Metrics** — Choose 6 enterprise indicators (revenue, employees, years, debt ratio, cash flow, litigation)
3. **Encrypt & Submit** — Data is FHE-encrypted locally, then sent to blockchain
4. **View Results** — Sign to decrypt your private credit profile

---

## ⚙️ Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │ Select 6    │───▶│ TFHE Encrypt│───▶│ Submit to Contract  │ │
│  │ Metrics     │    │ (Local)     │    │ (Ciphertext Only)   │ │
│  └─────────────┘    └─────────────┘    └──────────┬──────────┘ │
└──────────────────────────────────────────────────│─────────────┘
                                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ETHEREUM SEPOLIA (FHEVM)                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ CreditPulse.sol                                          │   │
│  │ • Receives encrypted inputs (euint8)                     │   │
│  │ • Computes: scaleScore = enc(revenue + employees + years)│   │
│  │ • Computes: healthScore = enc(debt + cashflow + litigation)│ │
│  │ • Stores encrypted results per user                      │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────│─────────────┘
                                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│  ┌─────────────────────┐    ┌──────────────────────────────┐   │
│  │ Read Encrypted      │───▶│ User Signs EIP712 Message    │   │
│  │ Handles from Chain  │    │ → Decrypt via Relayer SDK    │   │
│  └─────────────────────┘    └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 + TypeScript |
| Styling | Tailwind CSS |
| Wallet | wagmi + viem |
| FHE SDK | @zama-fhe/relayer-sdk v0.3 |
| Smart Contract | Solidity + Zama FHEVM |
| Network | Ethereum Sepolia Testnet |

---

## 📦 Quick Start

### Prerequisites

- Node.js 18+
- MetaMask with Sepolia ETH ([Faucet](https://sepoliafaucet.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/CreditPulse.git
cd CreditPulse

# Install frontend dependencies
cd frontend
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Smart Contract Setup (Optional - Already Deployed)

```bash
cd contracts
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your PRIVATE_KEY, SEPOLIA_RPC_URL, ETHERSCAN_API_KEY

# Compile
npm run compile

# Deploy to Sepolia
npx hardhat deploy --network sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

---

## 🧪 Testing

CreditPulse includes comprehensive smart contract tests that verify FHE operations.

### Run Tests

```bash
cd contracts
npm run test
```

### Test Coverage

```bash
npm run coverage
```

### Test Cases

| Test | Description |
|------|-------------|
| Deployment | Contract deploys correctly with no initial assessments |
| Submit Assessment | User can submit FHE-encrypted assessment data |
| Scale Score Calculation | Verifies `scaleScore = revenue + employees + years` on ciphertext |
| Health Score Calculation | Verifies `healthScore = debtRatio + cashflow + litigation` on ciphertext |
| Timestamp Storage | Assessment timestamp is recorded correctly |
| Multi-user Support | Different users can submit independent assessments |
| Access Control | Reverts when querying non-existent assessments |

### Sample Test Output

```
  CreditPulse
    ✔ should have no assessment after deployment
    ✔ should submit encrypted assessment successfully
    ✔ should calculate correct scale score (revenue + employees + years)
    ✔ should calculate correct health score (debtRatio + cashflow + litigation)
    ✔ should store assessment timestamp
    ✔ should allow different users to submit assessments
    ✔ should revert when getting grades for non-existent assessment

  7 passing (141ms)
```

---

## 🔗 Deployment Information

| Item | Value |
|------|-------|
| **Contract Address** | `0x4f3470AD346e54FC76B9AD1bE8141939Da252490` |
| **Network** | Ethereum Sepolia (Chain ID: 11155111) |
| **Verification** | ✅ Verified on Etherscan |
| **Etherscan Link** | [View Contract](https://sepolia.etherscan.io/address/0x4f3470AD346e54FC76B9AD1bE8141939Da252490#code) |

### Contract Functions

| Function | Description |
|----------|-------------|
| `submitAssessment()` | Submit FHE-encrypted enterprise metrics |
| `getScaleGrade()` | Get encrypted scale score handle |
| `getHealthGrade()` | Get encrypted health score handle |
| `hasAssessment()` | Check if user has submitted assessment |
| `getAssessmentTimestamp()` | Get assessment submission timestamp |

---

## 💼 Business Potential

### Target Market
- SMEs seeking privacy-preserving credit assessments
- Banks/lenders needing confidential enterprise data for underwriting
- Fintech platforms integrating credit scoring without data liability

### Value Proposition
1. **Privacy Compliance** — GDPR/CCPA compliant by design (no plaintext data exposure)
2. **Trust Minimization** — Enterprises don't need to trust the platform with raw data
3. **Verifiable Computation** — On-chain FHE ensures computation integrity
4. **Scalability** — Can extend to more complex credit models

### Future Roadmap
- [ ] Multi-chain deployment (Ethereum mainnet, L2s)
- [ ] Integration with DeFi lending protocols
- [ ] Historical assessment comparison
- [ ] Third-party data oracle integration
- [ ] Enterprise API for bulk assessments

---

## 📁 Project Structure

```
CreditPulse/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/              # Next.js app router
│   │   ├── components/       # React components
│   │   └── lib/              # Utilities & FHE client
│   └── public/               # Static assets
├── contracts/                # Smart contracts
│   ├── contracts/            # Solidity source files
│   ├── deploy/               # Deployment scripts
│   └── test/                 # Contract tests
└── README.md                 # This file
```

---

## 📚 Resources

- [Zama FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Zama Developer Program](https://docs.zama.org/programs/developer-program)
- [FHEVM Hardhat Plugin](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)

---

## 📄 License

This project is licensed under the MIT License.

---

**Built with 🔐 for the Zama Developer Program**

