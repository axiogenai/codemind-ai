import React, { useState } from 'react';
import {
  Split,
  ArrowRight,
  Search,
  Code2,
  Info
} from 'lucide-react';

interface DiffFunction {
  id: string;
  name: string;
  status: 'MODIFIED' | 'ADDED' | 'REMOVED' | 'REGRESSION';
  similarity: number;
  rvaA?: string;
  rvaB?: string;
  summary: string;
  codeA: string[];
  codeB: string[];
}

const SAMPLE_DIFF_DATA: DiffFunction[] = [
  {
    id: 'crypto_initialize',
    name: 'crypto_initialize_cipher(uint8_t *key)',
    status: 'REGRESSION',
    similarity: 78,
    rvaA: '0x140001500',
    rvaB: '0x1400015E0',
    summary: 'Changed initialization cipher parameters. Removed explicit IV zeroing before BCryptGenerateSymmetricKey.',
    codeA: [
      '// v2.4.1 Implementation',
      'NTSTATUS crypto_initialize_cipher(uint8_t *key) {',
      '    memset(g_initialization_vector, 0, 16);',
      '    if (key == NULL) return STATUS_INVALID_PARAMETER;',
      '    status = BCryptOpenAlgorithmProvider(&hAlg, BCRYPT_AES_ALGORITHM, NULL, 0);',
      '    status = BCryptSetProperty(hAlg, BCRYPT_CHAINING_MODE, BCRYPT_CHAIN_MODE_CBC, ...);',
      '    return status;',
      '}'
    ],
    codeB: [
      '// v2.5.0 Implementation',
      'NTSTATUS crypto_initialize_cipher(uint8_t *key) {',
      '    // [MODIFIED] Switched from CBC to authenticated GCM mode',
      '    if (key == NULL) return STATUS_INVALID_PARAMETER;',
      '    status = BCryptOpenAlgorithmProvider(&hAlg, BCRYPT_AES_ALGORITHM, NULL, 0);',
      '    status = BCryptSetProperty(hAlg, BCRYPT_CHAINING_MODE, BCRYPT_CHAIN_MODE_GCM, ...);',
      '    // [ALERT] Missing explicit validation of nonce uniqueness',
      '    return status;',
      '}'
    ]
  },
  {
    id: 'auth_validate_token',
    name: 'auth_validate_token(const char *token)',
    status: 'MODIFIED',
    similarity: 91,
    rvaA: '0x140002100',
    rvaB: '0x1400021A0',
    summary: 'Hardened input token bounds checking against stack overflow vulnerability.',
    codeA: [
      '// v2.4.1 Implementation',
      'BOOL auth_validate_token(const char *token) {',
      '    char buffer[128];',
      '    strcpy(buffer, token); // Vulnerable to unbounded copy',
      '    return verify_signature(buffer);',
      '}'
    ],
    codeB: [
      '// v2.5.0 Implementation',
      'BOOL auth_validate_token(const char *token) {',
      '    char buffer[128];',
      '    // [FIXED] Bound copy with strncpy_s',
      '    if (strncpy_s(buffer, sizeof(buffer), token, 127) != 0) {',
      '        return FALSE;',
      '    }',
      '    return verify_signature(buffer);',
      '}'
    ]
  },
  {
    id: 'telemetry_heartbeat',
    name: 'telemetry_send_heartbeat()',
    status: 'ADDED',
    similarity: 0,
    rvaA: undefined,
    rvaB: '0x140004500',
    summary: 'Newly introduced background network beacon to remote monitoring endpoint.',
    codeA: [
      '// Function did not exist in v2.4.1'
    ],
    codeB: [
      '// v2.5.0 Implementation (New Symbol)',
      'void telemetry_send_heartbeat() {',
      '    SOCKET s = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);',
      '    connect(s, &g_telemetry_sockaddr, sizeof(sockaddr));',
      '    send(s, g_heartbeat_payload, sizeof(g_heartbeat_payload), 0);',
      '    closesocket(s);',
      '}'
    ]
  },
  {
    id: 'legacy_des_decrypt',
    name: 'legacy_des_decrypt_buffer()',
    status: 'REMOVED',
    similarity: 0,
    rvaA: '0x140008100',
    rvaB: undefined,
    summary: 'Deprecated insecure single DES cipher routine was permanently eliminated.',
    codeA: [
      '// v2.4.1 Legacy routine (Deprecated)',
      'void legacy_des_decrypt_buffer(uint8_t *in, uint8_t *out) {',
      '    DES_ecb_encrypt(in, out, &key_schedule, DES_DECRYPT);',
      '}'
    ],
    codeB: [
      '// Symbol purged from v2.5.0 binary'
    ]
  }
];

export const BinaryDiffView: React.FC = () => {
  const [selectedFuncId, setSelectedFuncId] = useState<string>('crypto_initialize');
  const [searchFilter, setSearchFilter] = useState('');

  const currentFunc = SAMPLE_DIFF_DATA.find(f => f.id === selectedFuncId) || SAMPLE_DIFF_DATA[0];

  const filteredFuncs = SAMPLE_DIFF_DATA.filter(f =>
    f.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    f.status.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-full bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-900 dark:text-zinc-100 overflow-hidden select-none font-sans">
      {/* Header Bar */}
      <div className="shrink-0 border-b border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0D0E11] px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-white/[0.08] flex items-center justify-center border border-zinc-300 dark:border-white/[0.12] text-white">
            <Split className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold tracking-tight">Binary Diff & Version Analysis</h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-300 font-bold border border-zinc-200 dark:border-white/[0.08]">
                VERSION COMPARATOR
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Compare two executable builds, isolate changed functions, and summarize behavioral changes.
            </p>
          </div>
        </div>

        {/* Versions Pair */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <div className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-[#141519] border border-zinc-200 dark:border-white/[0.08]">
            <span className="text-zinc-400 mr-1.5">BASE (v1):</span>
            <span className="font-bold text-zinc-800 dark:text-zinc-200">daemon_v2.4.1.exe</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
          <div className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-[#141519] border border-zinc-200 dark:border-white/[0.08]">
            <span className="text-zinc-400 mr-1.5">TARGET (v2):</span>
            <span className="font-bold text-zinc-800 dark:text-zinc-200">daemon_v2.5.0.exe</span>
          </div>
        </div>
      </div>

      {/* Diff Delta Metrics Ribbon */}
      <div className="shrink-0 bg-zinc-100/60 dark:bg-[#121317] border-b border-zinc-200 dark:border-white/[0.08] px-5 py-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs font-mono">
        <div className="flex items-center space-x-1.5">
          <span className="text-zinc-400">TOTAL SYMBOLS COMPARED:</span>
          <span className="font-bold text-zinc-800 dark:text-zinc-200">358 Functions</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-zinc-400">MODIFIED:</span>
          <span className="font-bold text-zinc-800 dark:text-zinc-200">12</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-zinc-400">ADDED:</span>
          <span className="font-bold text-zinc-800 dark:text-zinc-200">+4</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-zinc-400">REMOVED:</span>
          <span className="font-bold text-zinc-800 dark:text-zinc-200">-1</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-zinc-400">POTENTIAL REGRESSIONS:</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100">2 Alerts</span>
        </div>
      </div>

      {/* Main Diff Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 overflow-hidden">
        {/* Changed Functions Sidebar */}
        <div className="bg-white dark:bg-[#0E0F13] border border-zinc-200 dark:border-white/[0.08] rounded-xl flex flex-col overflow-hidden shadow-xs">
          <div className="p-2.5 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#131418]">
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-2 text-zinc-400" />
              <input
                type="text"
                placeholder="Filter changed symbols..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-7 pr-2 py-1 text-xs font-mono bg-white dark:bg-[#1A1B20] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-800 dark:text-zinc-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
            {filteredFuncs.map((func) => (
              <button
                key={func.id}
                onClick={() => setSelectedFuncId(func.id)}
                className={`w-full text-left p-2.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                  selectedFuncId === func.id
                    ? 'bg-zinc-900 dark:bg-white/[0.12] text-white border-zinc-900 dark:border-white/[0.16] shadow-xs'
                    : 'bg-zinc-50/60 dark:bg-[#141519] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/[0.12]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                    func.status === 'REGRESSION'
                      ? 'bg-zinc-200 dark:bg-white/[0.12] text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-white/[0.16]'
                      : func.status === 'ADDED'
                      ? 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-white/[0.08]'
                      : func.status === 'REMOVED'
                      ? 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-500 border-zinc-200 dark:border-white/[0.08]'
                      : 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/[0.08]'
                  }`}>
                    {func.status}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-semibold">
                    {func.similarity > 0 ? `${func.similarity}% match` : 'New'}
                  </span>
                </div>
                <p className="font-semibold truncate">{func.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Side-by-Side Unified Code Diff */}
        <div className="lg:col-span-3 bg-white dark:bg-[#0E0F13] border border-zinc-200 dark:border-white/[0.08] rounded-xl flex flex-col overflow-hidden shadow-xs">
          {/* Header Bar */}
          <div className="p-3 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#131418] flex items-center justify-between font-mono text-xs">
            <div className="flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-zinc-500" />
              <span className="font-bold text-zinc-900 dark:text-white">{currentFunc.name}</span>
            </div>
            <div className="flex items-center space-x-3 text-[11px] text-zinc-500">
              <span>AST Similarity: <strong className="text-zinc-700 dark:text-zinc-300">{currentFunc.similarity}%</strong></span>
            </div>
          </div>

          {/* Behavioral Delta AI Summary */}
          <div className="p-3 bg-zinc-100/70 dark:bg-[#141519] border-b border-zinc-200 dark:border-white/[0.08] text-xs">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-mono font-bold uppercase text-[10px] text-zinc-400 block">
                  AI BEHAVIORAL DELTA SUMMARY
                </span>
                <p className="text-zinc-700 dark:text-zinc-300 mt-0.5">
                  {currentFunc.summary}
                </p>
              </div>
            </div>
          </div>

          {/* Side-by-Side Panes */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-white/[0.08] overflow-hidden font-mono text-xs">
            {/* Left: Base Version v2.4.1 */}
            <div className="flex flex-col overflow-hidden">
              <div className="p-2 border-b border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-[#121316] text-[11px] font-bold text-zinc-500 flex justify-between">
                <span>VERSION v2.4.1</span>
                <span>{currentFunc.rvaA || 'N/A'}</span>
              </div>
              <div className="flex-1 overflow-auto p-3 bg-zinc-950 text-zinc-300 custom-scrollbar select-text space-y-1">
                {currentFunc.codeA.map((line, idx) => (
                  <div key={idx} className="whitespace-pre">
                    {line}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Target Version v2.5.0 */}
            <div className="flex flex-col overflow-hidden">
              <div className="p-2 border-b border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-[#121316] text-[11px] font-bold text-zinc-500 flex justify-between">
                <span>VERSION v2.5.0</span>
                <span>{currentFunc.rvaB || 'N/A'}</span>
              </div>
              <div className="flex-1 overflow-auto p-3 bg-zinc-950 text-zinc-300 custom-scrollbar select-text space-y-1">
                {currentFunc.codeB.map((line, idx) => (
                  <div key={idx} className="whitespace-pre">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
