import React, { useState } from 'react';
import {
  BrainCircuit,
  CheckCircle2,
  Database,
  Info
} from 'lucide-react';

interface ParameterSpec {
  name: string;
  type: string;
  location: string;
  tainted: boolean;
  notes: string;
}

interface IntelligenceCard {
  id: string;
  name: string;
  rva: string;
  callingConvention: string;
  confidence: number;
  confidenceBreakdown: { metric: string; score: number }[];
  summary: string;
  detailedBehavior: string[];
  parameters: ParameterSpec[];
  returnValue: { type: string; meaning: string; errorValues: string };
  sideEffects: string[];
  evidence: { type: string; detail: string; offset: string }[];
  securityNotes: { rating: 'SAFE' | 'MEDIUM' | 'HIGH'; description: string }[];
}

const SAMPLE_INTELLIGENCE_DATA: Record<string, IntelligenceCard> = {
  'crypto_initialize_aes_gcm': {
    id: 'crypto_initialize_aes_gcm',
    name: 'crypto_initialize_aes_gcm',
    rva: '0x1400015E0',
    callingConvention: '__fastcall (Microsoft x64)',
    confidence: 96,
    confidenceBreakdown: [
      { metric: 'Cryptographic S-box Pattern', score: 98 },
      { metric: 'API Import Cross-References', score: 99 },
      { metric: 'Control Flow Graph Matching', score: 94 },
      { metric: 'String Symbol Fingerprints', score: 92 },
    ],
    summary: 'Initializes the Windows CNG (Cryptography Next Generation) subsystem for AES-256 in Galois/Counter Mode (GCM). Allocates an algorithm provider handle and enforces 256-bit symmetric cipher keys.',
    detailedBehavior: [
      'Queries BCryptOpenAlgorithmProvider with BCRYPT_AES_ALGORITHM provider identifier.',
      'Configures algorithm property chaining mode to BCRYPT_CHAIN_MODE_GCM.',
      'Validates that input key length strictly conforms to 32 bytes (256-bit AES standard).',
      'Stores the opaque algorithm handle into the caller-provided pointer.'
    ],
    parameters: [
      { name: 'key_data', type: 'const uint8_t*', location: 'RCX register', tainted: false, notes: 'Must point to 32 bytes of high-entropy key material' },
      { name: 'key_len', type: 'uint32_t', location: 'RDX register', tainted: false, notes: 'Must equal exactly 32 (0x20)' },
      { name: 'phAlg', type: 'BCRYPT_ALG_HANDLE*', location: 'R8 register', tainted: false, notes: 'Output handle pointer' },
    ],
    returnValue: {
      type: 'NTSTATUS',
      meaning: 'STATUS_SUCCESS (0x00000000) on successful cipher context instantiation.',
      errorValues: 'STATUS_INVALID_PARAMETER (0xC000000D), STATUS_UNSUCCESSFUL'
    },
    sideEffects: [
      'Allocates kernel-mode CNG provider resources via BCrypt',
      'Writes 8-byte pointer to [phAlg] memory location'
    ],
    evidence: [
      { type: 'API Import', detail: 'Calls BCryptOpenAlgorithmProvider (BCRYPT.DLL)', offset: '0x1400015F8' },
      { type: 'String Ref', detail: 'References wide string L"ChainingModeGCM"', offset: '0x1400021D0' },
      { type: 'Constant', detail: 'Immediate comparison with 0x20 (32 bytes)', offset: '0x1400015EC' }
    ],
    securityNotes: [
      { rating: 'SAFE', description: 'Explicit verification of 32-byte key size prevents undersized key attacks.' },
      { rating: 'MEDIUM', description: 'Caller must ensure proper lifetime management and invoke BCryptCloseAlgorithmProvider.' }
    ]
  },
  'auth_validate_token': {
    id: 'auth_validate_token',
    name: 'auth_validate_token',
    rva: '0x140001000',
    callingConvention: '__fastcall (Microsoft x64)',
    confidence: 91,
    confidenceBreakdown: [
      { metric: 'Token Header Parsing Heuristic', score: 95 },
      { metric: 'Signature Verification Call Flow', score: 92 },
      { metric: 'Error String References', score: 89 },
      { metric: 'Control Flow Graph Matching', score: 88 },
    ],
    summary: 'Extracts cryptographic claims and verifies signature validity for inbound authentication requests over RPC/WebSocket.',
    detailedBehavior: [
      'Checks input token pointer against NULL and enforces minimum string length.',
      'Computes SHA-256 digest of payload block.',
      'Executes constant-time signature comparison to mitigate timing attacks.',
      'Emits audit log event upon validation failure.'
    ],
    parameters: [
      { name: 'token', type: 'const char*', location: 'RCX register', tainted: true, notes: 'Untrusted user input string from client' },
      { name: 'len', type: 'size_t', location: 'RDX register', tainted: true, notes: 'Payload length specified by network packet' },
    ],
    returnValue: {
      type: 'BOOL',
      meaning: 'TRUE (1) if signature valid and claims unexpired, FALSE (0) otherwise.',
      errorValues: 'Returns FALSE on any parsing or signature defect.'
    },
    sideEffects: [
      'Writes security failure event to audit log descriptor on failure',
      'Allocates 128-byte scratch frame on stack'
    ],
    evidence: [
      { type: 'String Ref', detail: 'References string "FATAL: Token verification failure"', offset: '0x1400023B0' },
      { type: 'API Import', detail: 'Calls BCryptVerifySignature', offset: '0x140001090' },
      { type: 'Opcode', detail: 'Constant-time XOR memory compare sequence', offset: '0x140001050' }
    ],
    securityNotes: [
      { rating: 'SAFE', description: 'Timing-safe comparison prevents side-channel signature recovery.' }
    ]
  }
};

export const FunctionIntelligenceView: React.FC = () => {
  const [selectedFunctionId, setSelectedFunctionId] = useState<string>('crypto_initialize_aes_gcm');
  const card = SAMPLE_INTELLIGENCE_DATA[selectedFunctionId] || SAMPLE_INTELLIGENCE_DATA['crypto_initialize_aes_gcm'];

  return (
    <div className="flex flex-col h-full w-full bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-900 dark:text-zinc-100 overflow-hidden select-none font-sans">
      {/* Header Bar */}
      <div className="shrink-0 border-b border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0D0E11] px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-white/[0.08] flex items-center justify-center border border-zinc-300 dark:border-white/[0.12] text-white">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold tracking-tight">Function Intelligence</h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-300 font-bold border border-zinc-200 dark:border-white/[0.08]">
                NEURAL REVERSE
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              AI-generated explanations, inferred behavior, input/output relationships, and grounded evidence.
            </p>
          </div>
        </div>

        {/* Function Picker */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={selectedFunctionId}
            onChange={(e) => setSelectedFunctionId(e.target.value)}
            className="w-full sm:w-72 text-xs font-mono font-medium bg-zinc-100 dark:bg-[#141519] border border-zinc-200 dark:border-white/[0.08] rounded-lg px-3 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
          >
            {Object.keys(SAMPLE_INTELLIGENCE_DATA).map(key => (
              <option key={key} value={key}>
                {key} ({SAMPLE_INTELLIGENCE_DATA[key].rva})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Function Metadata Bar */}
      <div className="shrink-0 bg-zinc-100/60 dark:bg-[#121317] border-b border-zinc-200 dark:border-white/[0.08] px-5 py-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs font-mono">
        <div className="flex items-center space-x-1.5">
          <span className="text-zinc-400">RVA:</span>
          <span className="font-bold text-zinc-900 dark:text-white">{card.rva}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-zinc-400">CONVENTION:</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{card.callingConvention}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-zinc-400">AI CONFIDENCE:</span>
          <span className="font-bold text-zinc-900 dark:text-white">{card.confidence}%</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-zinc-400">PARAMETERS:</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{card.parameters.length} Inferred</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4 custom-scrollbar space-y-4">
        {/* Top Grid: Executive Summary & Confidence Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Executive Summary Card */}
          <div className="lg:col-span-2 bg-white dark:bg-[#0E0F13] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-4 shadow-xs">
            <div className="flex items-center space-x-2 pb-2 mb-2 border-b border-zinc-200 dark:border-white/[0.06]">
              <Info className="w-4 h-4 text-zinc-500" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Inferred Purpose & Architectural Summary
              </h3>
            </div>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {card.summary}
            </p>

            <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-white/[0.06]">
              <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block mb-2">
                RECONSTRUCTED EXECUTION STEPS
              </span>
              <ul className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                {card.detailedBehavior.map((step, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="font-mono text-[10px] text-zinc-400 mt-0.5 font-bold">0{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* AI Confidence Breakdown */}
          <div className="bg-white dark:bg-[#0E0F13] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-4 shadow-xs">
            <div className="flex items-center space-x-2 pb-2 mb-2 border-b border-zinc-200 dark:border-white/[0.06]">
              <CheckCircle2 className="w-4 h-4 text-zinc-500" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Confidence Model ({card.confidence}%)
              </h3>
            </div>
            <div className="space-y-3 mt-3">
              {card.confidenceBreakdown.map((item, idx) => (
                <div key={idx} className="space-y-1 font-mono text-xs">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-500">{item.metric}</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{item.score}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-white/[0.08] overflow-hidden">
                    <div
                      className="h-full bg-zinc-800 dark:bg-white rounded-full"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Input / Output Parameters Table */}
        <div className="bg-white dark:bg-[#0E0F13] border border-zinc-200 dark:border-white/[0.08] rounded-xl overflow-hidden shadow-xs">
          <div className="p-3 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#131418] flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 uppercase">
              INFERRED FUNCTION SIGNATURE & ARGUMENT CONTRACT
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-100/70 dark:bg-[#15161C] border-b border-zinc-200 dark:border-white/[0.08] text-zinc-500 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4 font-bold">Parameter</th>
                  <th className="py-2.5 px-3 font-bold">Inferred Type</th>
                  <th className="py-2.5 px-3 font-bold">Calling Location</th>
                  <th className="py-2.5 px-3 font-bold">Taint Status</th>
                  <th className="py-2.5 px-4 font-bold">Validation Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.04]">
                {card.parameters.map((p, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-4 font-bold text-zinc-900 dark:text-white">{p.name}</td>
                    <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300 font-semibold">{p.type}</td>
                    <td className="py-2.5 px-3 text-zinc-500">{p.location}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${
                        p.tainted
                          ? 'bg-zinc-200 dark:bg-white/[0.12] text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-white/[0.16]'
                          : 'bg-zinc-100 dark:bg-white/[0.04] text-zinc-500 border-zinc-200 dark:border-white/[0.06]'
                      }`}>
                        {p.tainted ? 'TAINTED INPUT' : 'SANITIZED'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-zinc-600 dark:text-zinc-400 font-sans">{p.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Return Values & Side Effects */}
          <div className="p-3 bg-zinc-50 dark:bg-[#131418] border-t border-zinc-200 dark:border-white/[0.08] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Return Value Specification</span>
              <p className="font-semibold text-zinc-800 dark:text-zinc-200">{card.returnValue.type}</p>
              <p className="text-zinc-500 text-[11px] mt-0.5">{card.returnValue.meaning}</p>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Downstream Side Effects</span>
              <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-400 text-[11px] space-y-0.5">
                {card.sideEffects.map((effect, idx) => (
                  <li key={idx}>{effect}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Evidence References Card */}
        <div className="bg-white dark:bg-[#0E0F13] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-4 shadow-xs">
          <div className="flex items-center space-x-2 pb-2 mb-2 border-b border-zinc-200 dark:border-white/[0.06]">
            <Database className="w-4 h-4 text-zinc-500" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Corroborating Disassembly Evidence & Cross-References
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            {card.evidence.map((ev, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-zinc-50 dark:bg-[#141519] border border-zinc-200 dark:border-white/[0.06] text-xs font-mono">
                <div className="flex justify-between items-center text-[10px] text-zinc-400 mb-1">
                  <span className="font-bold">{ev.type}</span>
                  <span>{ev.offset}</span>
                </div>
                <p className="font-medium text-zinc-800 dark:text-zinc-200">{ev.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
