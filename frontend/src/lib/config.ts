import { http, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';

// Contract address deployed on Sepolia
export const CREDIT_PULSE_CONTRACT_ADDRESS = '0x4f3470AD346e54FC76B9AD1bE8141939Da252490' as const;

// Create a simple injected connector (avoid importing all connectors from wagmi/connectors)
const injectedConnector = {
  id: 'injected',
  name: 'Injected',
  type: 'injected' as const,
};

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/PCMI-OSf5v5_DuQLHQ2Uz'),
  },
  ssr: true,
});

// Contract ABI
export const CREDIT_PULSE_ABI = [
  {
    type: 'function',
    name: 'submitAssessment',
    inputs: [
      { name: 'encRevenue', type: 'bytes32', internalType: 'externalEuint8' },
      { name: 'encEmployees', type: 'bytes32', internalType: 'externalEuint8' },
      { name: 'encYears', type: 'bytes32', internalType: 'externalEuint8' },
      { name: 'encDebtRatio', type: 'bytes32', internalType: 'externalEuint8' },
      { name: 'encCashflow', type: 'bytes32', internalType: 'externalEuint8' },
      { name: 'encLitigation', type: 'bytes32', internalType: 'externalEuint8' },
      { name: 'inputProof', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getScaleGrade',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'euint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getHealthGrade',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'euint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'hasAssessment',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getAssessmentTimestamp',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'AssessmentSubmitted',
    inputs: [
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'AssessmentCompleted',
    inputs: [
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
    ],
    anonymous: false,
  },
] as const;

// Assessment metric options
export const METRICS = {
  revenue: {
    label: 'Annual Revenue',
    options: [
      { value: 1, label: '< $100K' },
      { value: 2, label: '$100K - $1M' },
      { value: 3, label: '$1M - $10M' },
      { value: 4, label: '$10M - $50M' },
      { value: 5, label: '> $50M' },
    ],
  },
  employees: {
    label: 'Employee Count',
    options: [
      { value: 1, label: '< 10' },
      { value: 2, label: '10 - 50' },
      { value: 3, label: '50 - 200' },
      { value: 4, label: '200 - 500' },
      { value: 5, label: '> 500' },
    ],
  },
  years: {
    label: 'Years in Business',
    options: [
      { value: 1, label: '< 1 Year' },
      { value: 2, label: '1 - 3 Years' },
      { value: 3, label: '3 - 5 Years' },
      { value: 4, label: '> 5 Years' },
    ],
  },
  debtRatio: {
    label: 'Debt-to-Asset Ratio',
    options: [
      { value: 5, label: '< 30%' },
      { value: 4, label: '30% - 50%' },
      { value: 3, label: '50% - 70%' },
      { value: 2, label: '70% - 90%' },
      { value: 1, label: '> 90%' },
    ],
  },
  cashflow: {
    label: 'Cash Flow Status',
    options: [
      { value: 3, label: 'Positive (>6 months)' },
      { value: 2, label: 'Balanced' },
      { value: 1, label: 'Negative' },
    ],
  },
  litigation: {
    label: 'Litigation Status',
    options: [
      { value: 3, label: 'No Litigation' },
      { value: 2, label: 'Minor Litigation' },
      { value: 1, label: 'Major Litigation' },
    ],
  },
};

// Result mapping
export const SCALE_GRADES = [
  { min: 3, max: 5, grade: 'MICRO', label: 'Micro Enterprise' },
  { min: 6, max: 8, grade: 'SMALL', label: 'Small Enterprise' },
  { min: 9, max: 11, grade: 'MEDIUM', label: 'Medium Enterprise' },
  { min: 12, max: 14, grade: 'LARGE', label: 'Large Enterprise' },
];

export const HEALTH_GRADES = [
  { min: 9, max: 11, grade: 'A', label: 'Excellent' },
  { min: 7, max: 8, grade: 'B', label: 'Good' },
  { min: 5, max: 6, grade: 'C', label: 'Fair' },
  { min: 3, max: 4, grade: 'D', label: 'Needs Attention' },
];

export const LOAN_RECOMMENDATIONS: Record<string, { amount: string; rate: string; speed: string }> = {
  'LARGE_A': { amount: '$5M - $50M', rate: '3.5% - 5%', speed: 'Fast' },
  'LARGE_B': { amount: '$2M - $10M', rate: '5% - 7%', speed: 'Standard' },
  'MEDIUM_A': { amount: '$500K - $2M', rate: '4.5% - 6.5%', speed: 'Fast' },
  'MEDIUM_B': { amount: '$200K - $1M', rate: '6% - 8%', speed: 'Standard' },
  'SMALL_A': { amount: '$50K - $500K', rate: '5.5% - 7.5%', speed: 'Standard' },
  'SMALL_B': { amount: '$20K - $200K', rate: '7% - 9%', speed: 'Standard' },
  'MICRO_A': { amount: '$5K - $50K', rate: '8% - 12%', speed: 'Standard' },
  'MICRO_B': { amount: '$5K - $50K', rate: '8% - 12%', speed: 'Standard' },
  'LARGE_C': { amount: '$10K - $100K', rate: '10% - 15%', speed: 'Requires Collateral' },
  'MEDIUM_C': { amount: '$10K - $100K', rate: '10% - 15%', speed: 'Requires Collateral' },
  'SMALL_C': { amount: '$10K - $100K', rate: '10% - 15%', speed: 'Requires Collateral' },
  'MICRO_C': { amount: '$10K - $100K', rate: '10% - 15%', speed: 'Requires Collateral' },
  'LARGE_D': { amount: 'Not Recommended', rate: '-', speed: '-' },
  'MEDIUM_D': { amount: 'Not Recommended', rate: '-', speed: '-' },
  'SMALL_D': { amount: 'Not Recommended', rate: '-', speed: '-' },
  'MICRO_D': { amount: 'Not Recommended', rate: '-', speed: '-' },
};

export function getScaleGrade(score: number) {
  for (const grade of SCALE_GRADES) {
    if (score >= grade.min && score <= grade.max) {
      return grade;
    }
  }
  return SCALE_GRADES[0];
}

export function getHealthGrade(score: number) {
  for (const grade of HEALTH_GRADES) {
    if (score >= grade.min && score <= grade.max) {
      return grade;
    }
  }
  return HEALTH_GRADES[3];
}

export function getLoanRecommendation(scaleGrade: string, healthGrade: string) {
  const key = `${scaleGrade}_${healthGrade}`;
  return LOAN_RECOMMENDATIONS[key] || LOAN_RECOMMENDATIONS['MICRO_D'];
}
