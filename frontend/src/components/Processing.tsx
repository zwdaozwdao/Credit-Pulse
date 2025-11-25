'use client';

type ProcessingStep = 'encrypting' | 'submitting' | 'computing' | 'decrypting';

interface ProcessingProps {
  step: ProcessingStep;
  onBack: () => void;
  onHome: () => void;
}

export function Processing({ step, onBack, onHome }: ProcessingProps) {
  const steps: { id: ProcessingStep; label: string; desc: string }[] = [
    { id: 'encrypting', label: 'FHE Encryption', desc: 'Encrypting inputs with TFHE locally...' },
    { id: 'submitting', label: 'Blockchain Submission', desc: 'Sending encrypted ciphertext to Sepolia...' },
    { id: 'computing', label: 'Homomorphic Computation', desc: 'Smart contract calculating scores on ciphertext...' },
    { id: 'decrypting', label: 'FHE Decryption', desc: 'Decrypting results with your wallet signature...' },
  ];

  const currentIdx = steps.findIndex(s => s.id === step);

  return (
    <div className="flex-grow flex flex-col items-center justify-center px-6 py-20">
      {/* Navigation Bar - Force page reload to interrupt any ongoing operations */}
      <div className="w-full max-w-lg flex items-center justify-between mb-6">
        <a
          href="/"
          className="flex items-center gap-2 text-slate-900 hover:text-slate-900 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            if (confirm('This will cancel the current operation. Are you sure?')) {
              window.location.href = '/';
            }
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </a>
        <a
          href="/"
          className="flex items-center gap-2 text-slate-900 hover:text-slate-900 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            if (confirm('This will cancel the current operation. Are you sure?')) {
              window.location.href = '/';
            }
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Home
        </a>
      </div>

      <div className="glass-card max-w-lg w-full p-10 rounded-3xl text-center space-y-10 relative overflow-hidden">
        
        {/* Artistic Loader */}
        <div className="relative w-32 h-32 mx-auto">
          <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-4 bg-slate-50 rounded-full flex items-center justify-center">
             <span className="text-3xl">🛡️</span>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 font-serif-display">
            {steps[currentIdx].label}
          </h2>
          <p className="text-slate-900">
            {steps[currentIdx].desc}
          </p>
        </div>

        {/* Steps Progress */}
        <div className="space-y-4 pt-4 text-left">
          {steps.map((s, idx) => (
            <div key={s.id} className="flex items-center gap-4 transition-all duration-500">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border transition-colors duration-500
                ${idx < currentIdx ? 'bg-emerald-500 border-emerald-500 text-white' : 
                  idx === currentIdx ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30' : 
                  'bg-white border-slate-200 text-slate-300'}
              `}>
                {idx < currentIdx ? '✓' : idx + 1}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${idx === currentIdx ? 'text-slate-900' : 'text-slate-900'}`}>
                  {s.label}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
