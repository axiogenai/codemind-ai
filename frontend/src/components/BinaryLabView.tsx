import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Binary,
  Search,
  Copy,
  Check,
  Code2,
  Table,
  Eye,
  FileSearch,
  Hash,
  Terminal,
  ChevronRight,
  FolderOpen
} from 'lucide-react';

interface BinarySample {
  id: string;
  filename: string;
  format: 'PE32+' | 'ELF64' | 'Mach-O' | 'PE Kernel';
  arch: 'x86_64' | 'ARM64' | 'x86';
  size: string;
  sha256: string;
  entropy: number;
  sectionsCount: number;
  subsystem: string;
  compiler: string;
  mitigations: { aslr: boolean; dep: boolean; cfg: boolean; safeSeh: boolean };
}

const PRELOADED_BINARIES: BinarySample[] = [
  {
    id: 'daemon',
    filename: 'daemon_agent.exe',
    format: 'PE32+',
    arch: 'x86_64',
    size: '488.2 KB',
    sha256: '9f83b2a1c0de7419a4e320bf05b631d8e41f9273528bca01e4599a8019b88ef7',
    entropy: 6.42,
    sectionsCount: 6,
    subsystem: 'Console (Windows)',
    compiler: 'MSVC 19.34 (Visual Studio 2022)',
    mitigations: { aslr: true, dep: true, cfg: true, safeSeh: true }
  },
  {
    id: 'libcrypto',
    filename: 'libcrypto_vault.so.3',
    format: 'ELF64',
    arch: 'x86_64',
    size: '1.42 MB',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    entropy: 5.88,
    sectionsCount: 28,
    subsystem: 'Linux Shared Object',
    compiler: 'GCC 12.2.0 (Ubuntu x86_64)',
    mitigations: { aslr: true, dep: true, cfg: false, safeSeh: false }
  },
  {
    id: 'driver',
    filename: 'kernel_telemetry.sys',
    format: 'PE Kernel',
    arch: 'x86_64',
    size: '194.5 KB',
    sha256: '4a6b2c9e7f8012d3546789abcde0123456789abcdef0123456789abcdef01234',
    entropy: 7.15,
    sectionsCount: 5,
    subsystem: 'Native (Kernel Mode Driver)',
    compiler: 'WDK 10.0.22621 (Kernel Mode)',
    mitigations: { aslr: true, dep: true, cfg: true, safeSeh: true }
  }
];

// Sample Hex Data generator
const GENERATE_HEX_ROWS = (baseOffset = 0x00401000) => {
  const bytesPool = [
    [0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0xff, 0xff, 0x00, 0x00],
    [0xb8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
    [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
    [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x00, 0x00, 0x00],
    [0x0e, 0x1f, 0xba, 0x0e, 0x00, 0xb4, 0x09, 0xcd, 0x21, 0xb8, 0x01, 0x4c, 0xcd, 0x21, 0x54, 0x68],
    [0x69, 0x73, 0x20, 0x70, 0x72, 0x6f, 0x67, 0x72, 0x61, 0x6d, 0x20, 0x63, 0x61, 0x6e, 0x6e, 0x6f],
    [0x74, 0x20, 0x62, 0x65, 0x20, 0x72, 0x75, 0x6e, 0x20, 0x69, 0x6e, 0x20, 0x44, 0x4f, 0x53, 0x20],
    [0x6d, 0x6f, 0x64, 0x65, 0x2e, 0x0d, 0x0d, 0x0a, 0x24, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
    [0x50, 0x45, 0x00, 0x00, 0x64, 0x86, 0x06, 0x00, 0x9f, 0x83, 0xb2, 0x65, 0x00, 0x00, 0x00, 0x00],
    [0x00, 0x00, 0x00, 0x00, 0xf0, 0x00, 0x22, 0x00, 0x0b, 0x02, 0x0e, 0x22, 0x00, 0x60, 0x01, 0x00],
    [0x00, 0x40, 0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x20, 0x14, 0x00, 0x00, 0x00, 0x10, 0x00, 0x00],
    [0x00, 0x00, 0x40, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00],
    [0x48, 0x89, 0x5c, 0x24, 0x08, 0x48, 0x89, 0x6c, 0x24, 0x10, 0x48, 0x89, 0x74, 0x24, 0x18, 0x57],
    [0x48, 0x83, 0xec, 0x20, 0x48, 0x8b, 0xf9, 0xe8, 0x23, 0x0f, 0x00, 0x00, 0x85, 0xc0, 0x75, 0x14],
    [0x48, 0x8d, 0x0d, 0xa5, 0x2f, 0x01, 0x00, 0xe8, 0x76, 0x12, 0x00, 0x00, 0x33, 0xc0, 0x48, 0x83],
    [0xc4, 0x20, 0x5f, 0xc3, 0xcc, 0xcc, 0xcc, 0xcc, 0xcc, 0xcc, 0xcc, 0xcc, 0xcc, 0xcc, 0xcc, 0xcc],
  ];

  return bytesPool.map((bytes, idx) => {
    const offset = baseOffset + idx * 16;
    const hex = bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase());
    const ascii = bytes.map(b => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join('');
    return {
      offset: `0x${offset.toString(16).padStart(8, '0').toUpperCase()}`,
      bytes,
      hex,
      ascii
    };
  });
};

interface StringItem {
  offset: string;
  section: string;
  length: number;
  encoding: 'ASCII' | 'UTF-16LE';
  category: 'URL' | 'FILE_PATH' | 'CRYPTO' | 'API_NAME' | 'MESSAGE' | 'REGISTRY';
  value: string;
  entropy: number;
}

const SAMPLE_STRINGS: StringItem[] = [
  { offset: '0x004021A0', section: '.rdata', length: 34, encoding: 'ASCII', category: 'MESSAGE', value: 'This program cannot be run in DOS mode.', entropy: 4.12 },
  { offset: '0x00402204', section: '.rdata', length: 28, encoding: 'ASCII', category: 'URL', value: 'https://api.internal.vault/v2', entropy: 4.65 },
  { offset: '0x00402240', section: '.rdata', length: 32, encoding: 'ASCII', category: 'FILE_PATH', value: 'C:\\Windows\\System32\\drivers\\etc', entropy: 4.22 },
  { offset: '0x00402280', section: '.rdata', length: 44, encoding: 'ASCII', category: 'REGISTRY', value: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run', entropy: 4.88 },
  { offset: '0x004022E0', section: '.rdata', length: 24, encoding: 'ASCII', category: 'CRYPTO', value: 'AES-256-GCM-AUTHENTICATED', entropy: 4.78 },
  { offset: '0x00402310', section: '.rdata', length: 18, encoding: 'ASCII', category: 'API_NAME', value: 'CreateProcessInternalW', entropy: 4.05 },
  { offset: '0x00402330', section: '.rdata', length: 15, encoding: 'ASCII', category: 'API_NAME', value: 'VirtualAllocEx', entropy: 3.92 },
  { offset: '0x00402350', section: '.rdata', length: 19, encoding: 'ASCII', category: 'API_NAME', value: 'WriteProcessMemory', entropy: 4.18 },
  { offset: '0x00402380', section: '.rdata', length: 22, encoding: 'ASCII', category: 'CRYPTO', value: 'BCryptDecryptSessionKey', entropy: 4.62 },
  { offset: '0x004023B0', section: '.rdata', length: 36, encoding: 'ASCII', category: 'MESSAGE', value: 'FATAL: Memory integrity check failed', entropy: 4.31 },
  { offset: '0x00402400', section: '.rdata', length: 26, encoding: 'UTF-16LE', category: 'FILE_PATH', value: '\\Device\\HarddiskVolume1\\sys', entropy: 4.40 },
  { offset: '0x00402450', section: '.rdata', length: 38, encoding: 'ASCII', category: 'URL', value: 'tcp://10.14.0.22:8443/cluster_heartbeat', entropy: 4.79 },
];

interface ImportItem {
  dll: string;
  function: string;
  ordinal: number;
  rva: string;
  risk: 'HIGH' | 'MEDIUM' | 'SAFE';
  category: string;
}

const SAMPLE_IMPORTS: ImportItem[] = [
  { dll: 'KERNEL32.DLL', function: 'VirtualAllocEx', ordinal: 1402, rva: '0x00406000', risk: 'HIGH', category: 'Memory Allocation / Injection' },
  { dll: 'KERNEL32.DLL', function: 'WriteProcessMemory', ordinal: 1488, rva: '0x00406008', risk: 'HIGH', category: 'Process Manipulation' },
  { dll: 'KERNEL32.DLL', function: 'CreateRemoteThread', ordinal: 412, rva: '0x00406010', risk: 'HIGH', category: 'Execution / Code Injection' },
  { dll: 'KERNEL32.DLL', function: 'GetProcAddress', ordinal: 672, rva: '0x00406018', risk: 'MEDIUM', category: 'Dynamic API Resolution' },
  { dll: 'KERNEL32.DLL', function: 'LoadLibraryA', ordinal: 890, rva: '0x00406020', risk: 'MEDIUM', category: 'Dynamic Library Loading' },
  { dll: 'KERNEL32.DLL', function: 'QueryPerformanceCounter', ordinal: 1102, rva: '0x00406028', risk: 'SAFE', category: 'Timing / Telemetry' },
  { dll: 'ADVAPI32.DLL', function: 'CryptAcquireContextW', ordinal: 182, rva: '0x00406030', risk: 'SAFE', category: 'Cryptographic Provider' },
  { dll: 'ADVAPI32.DLL', function: 'CryptDecrypt', ordinal: 194, rva: '0x00406038', risk: 'MEDIUM', category: 'Payload Decryption' },
  { dll: 'WS2_32.DLL', function: 'WSAStartup', ordinal: 115, rva: '0x00406040', risk: 'SAFE', category: 'Networking Init' },
  { dll: 'WS2_32.DLL', function: 'connect', ordinal: 4, rva: '0x00406048', risk: 'MEDIUM', category: 'Network Socket Connection' },
  { dll: 'WS2_32.DLL', function: 'send', ordinal: 19, rva: '0x00406050', risk: 'MEDIUM', category: 'Data Transmission' },
  { dll: 'WS2_32.DLL', function: 'recv', ordinal: 16, rva: '0x00406058', risk: 'MEDIUM', category: 'Data Ingestion' },
];

interface AsmInstruction {
  offset: string;
  bytes: string;
  mnemonic: string;
  operands: string;
  comment?: string;
}

const SAMPLE_ASM_FUNCTIONS: Record<string, AsmInstruction[]> = {
  'main_entry': [
    { offset: '0x140001000', bytes: '48 89 5C 24 08', mnemonic: 'mov', operands: 'qword ptr [rsp+8], rbx', comment: 'Preserve rbx register' },
    { offset: '0x140001005', bytes: '48 89 6C 24 10', mnemonic: 'mov', operands: 'qword ptr [rsp+10h], rbp', comment: 'Preserve rbp register' },
    { offset: '0x14000100A', bytes: '48 89 74 24 18', mnemonic: 'mov', operands: 'qword ptr [rsp+18h], rsi', comment: 'Preserve rsi register' },
    { offset: '0x14000100F', bytes: '57', mnemonic: 'push', operands: 'rdi', comment: 'Push rdi onto stack' },
    { offset: '0x140001010', bytes: '48 83 EC 20', mnemonic: 'sub', operands: 'rsp, 20h', comment: 'Allocate shadow stack space (32 bytes)' },
    { offset: '0x140001014', bytes: '48 8B F9', mnemonic: 'mov', operands: 'rdi, rcx', comment: 'rdi = target_ctx pointer' },
    { offset: '0x140001017', bytes: 'E8 E4 FF FF FF', mnemonic: 'call', operands: 'sub_140001000_verify_security_cookie', comment: 'Verify __security_cookie' },
    { offset: '0x14000101C', bytes: '85 C0', mnemonic: 'test', operands: 'eax, eax', comment: 'Check initialization status' },
    { offset: '0x14000101E', bytes: '75 1C', mnemonic: 'jnz', operands: 'loc_14000103C', comment: 'Branch on error (branch probability: 4%)' },
    { offset: '0x140001020', bytes: '48 8D 0D D9 1F 00 00', mnemonic: 'lea', operands: 'rcx, [g_auth_secret_token]', comment: 'Load auth token offset' },
    { offset: '0x140001027', bytes: 'BA 20 00 00 00', mnemonic: 'mov', operands: 'edx, 20h', comment: 'Key length = 32 bytes (256-bit)' },
    { offset: '0x14000102C', bytes: 'E8 AF 05 00 00', mnemonic: 'call', operands: 'crypto_initialize_aes_gcm', comment: 'Initialize cipher state' },
    { offset: '0x140001031', bytes: '48 8B D8', mnemonic: 'mov', operands: 'rbx, rax', comment: 'rbx = cipher context' },
    { offset: '0x140001034', bytes: '48 85 C0', mnemonic: 'test', operands: 'rax, rax', comment: 'Verify handle validity' },
    { offset: '0x140001037', bytes: '74 08', mnemonic: 'jz', operands: 'loc_140001041', comment: 'Fail if NULL' },
    { offset: '0x140001039', bytes: '33 C0', mnemonic: 'xor', operands: 'eax, eax', comment: 'return STATUS_SUCCESS (0)' },
    { offset: '0x14000103B', bytes: 'EB 0A', mnemonic: 'jmp', operands: 'loc_return', comment: 'Jump to epilogue' },
    { offset: '0x14000103C', bytes: 'B8 05 00 00 C0', mnemonic: 'mov', operands: 'eax, 0C0000005h', comment: 'STATUS_ACCESS_VIOLATION' },
    { offset: '0x140001041', bytes: 'B8 08 00 00 C0', mnemonic: 'mov', operands: 'eax, 0C0000008h', comment: 'STATUS_INVALID_HANDLE' },
    { offset: '0x140001046', bytes: '48 83 C4 20', mnemonic: 'add', operands: 'rsp, 20h', comment: 'loc_return: Restore stack pointer' },
    { offset: '0x14000104A', bytes: '5F', mnemonic: 'pop', operands: 'rdi', comment: 'Restore rdi' },
    { offset: '0x14000104B', bytes: '48 8B 74 24 18', mnemonic: 'mov', operands: 'rsi, qword ptr [rsp+18h]', comment: 'Restore rsi' },
    { offset: '0x140001050', bytes: '48 8B 6C 24 10', mnemonic: 'mov', operands: 'rbp, qword ptr [rsp+10h]', comment: 'Restore rbp' },
    { offset: '0x140001055', bytes: '48 8B 5C 24 08', mnemonic: 'mov', operands: 'rbx, qword ptr [rsp+8]', comment: 'Restore rbx' },
    { offset: '0x14000105A', bytes: 'C3', mnemonic: 'ret', operands: '', comment: 'Return to caller' },
  ],
  'crypto_initialize_aes_gcm': [
    { offset: '0x1400015E0', bytes: '48 89 4C 24 08', mnemonic: 'mov', operands: 'qword ptr [rsp+8], rcx', comment: 'key_data buffer' },
    { offset: '0x1400015E5', bytes: '57', mnemonic: 'push', operands: 'rdi', comment: 'Preserve rdi' },
    { offset: '0x1400015E6', bytes: '48 83 EC 30', mnemonic: 'sub', operands: 'rsp, 30h', comment: 'Stack frame' },
    { offset: '0x1400015EA', bytes: '48 8D 4C 24 20', mnemonic: 'lea', operands: 'rcx, [rsp+20h]', comment: 'hAlg handle output' },
    { offset: '0x1400015EF', bytes: '48 8D 15 8A 0B 00 00', mnemonic: 'lea', operands: 'rdx, [BCRYPT_AES_ALGORITHM]', comment: 'L"AES"' },
    { offset: '0x1400015F6', bytes: '33 C9', mnemonic: 'xor', operands: 'r9d, r9d', comment: 'Flags = 0' },
    { offset: '0x1400015F8', bytes: 'FF 15 22 4A 00 00', mnemonic: 'call', operands: 'qword ptr [__imp_BCryptOpenAlgorithmProvider]', comment: 'Query BCrypt provider' },
    { offset: '0x1400015FE', bytes: '85 C0', mnemonic: 'test', operands: 'eax, eax', comment: 'Check NTSTATUS' },
    { offset: '0x140001600', bytes: '78 18', mnemonic: 'js', operands: 'loc_fail', comment: 'Jump on negative status' },
    { offset: '0x140001602', bytes: '48 8B 44 24 20', mnemonic: 'mov', operands: 'rax, qword ptr [rsp+20h]', comment: 'Return handle in rax' },
    { offset: '0x140001607', bytes: '48 83 C4 30', mnemonic: 'add', operands: 'rsp, 30h', comment: 'Epilogue' },
    { offset: '0x14000160B', bytes: '5F', mnemonic: 'pop', operands: 'rdi', comment: 'Pop rdi' },
    { offset: '0x14000160C', bytes: 'C3', mnemonic: 'ret', operands: '', comment: 'Return' },
  ]
};

const SAMPLE_DECOMPILED_CODE: Record<string, string> = {
  'main_entry': `/**
 * Reconstructed C pseudocode via CodeMind Neural Decompiler
 * Target: daemon_agent.exe (x86_64 PE)
 * Function: main_entry (RVA: 0x00001000)
 */

#include <windows.h>
#include <bcrypt.h>

NTSTATUS main_entry(PVOID target_ctx) {
    BCRYPT_ALG_HANDLE hCipherAlg = NULL;
    NTSTATUS status;

    // Validate runtime GS buffer security cookie
    if (__security_cookie_validate() != 0) {
        return STATUS_ACCESS_VIOLATION; // 0xC0000005
    }

    // Initialize cryptographic AES-256 GCM subsystem
    status = crypto_initialize_aes_gcm(
        (const uint8_t*)&g_auth_secret_token, 
        32 /* 256 bits */,
        &hCipherAlg
    );

    if (!NT_SUCCESS(status) || hCipherAlg == NULL) {
        // Fallback to error dispatcher
        log_security_event(EVENT_CIPHER_INIT_FAILED, status);
        return STATUS_INVALID_HANDLE; // 0xC0000008
    }

    // Store verified cryptographic provider context
    g_runtime_state.cipher_engine = hCipherAlg;
    g_runtime_state.is_initialized = TRUE;

    return STATUS_SUCCESS; // 0x00000000
}`,
  'crypto_initialize_aes_gcm': `/**
 * Reconstructed C pseudocode via CodeMind Neural Decompiler
 * Target: daemon_agent.exe (x86_64 PE)
 * Function: crypto_initialize_aes_gcm (RVA: 0x000015E0)
 */

NTSTATUS crypto_initialize_aes_gcm(const uint8_t *key_data, uint32_t key_len, BCRYPT_ALG_HANDLE *phAlg) {
    NTSTATUS status;
    BCRYPT_ALG_HANDLE hAlg = NULL;

    if (!key_data || key_len != 32 || !phAlg) {
        return STATUS_INVALID_PARAMETER;
    }

    status = BCryptOpenAlgorithmProvider(
        &hAlg,
        BCRYPT_AES_ALGORITHM,
        NULL,
        0
    );

    if (!NT_SUCCESS(status)) {
        return status;
    }

    // Configure Galois/Counter Mode (GCM) chaining
    status = BCryptSetProperty(
        hAlg,
        BCRYPT_CHAINING_MODE,
        (PUCHAR)BCRYPT_CHAIN_MODE_GCM,
        sizeof(BCRYPT_CHAIN_MODE_GCM),
        0
    );

    if (!NT_SUCCESS(status)) {
        BCryptCloseAlgorithmProvider(hAlg, 0);
        return status;
    }

    *phAlg = hAlg;
    return STATUS_SUCCESS;
}`
};

export const BinaryLabView: React.FC = () => {
  const [selectedBinary, setSelectedBinary] = useState<BinarySample>(PRELOADED_BINARIES[0]);
  const [activeSubTab, setActiveSubTab] = useState<'hex' | 'strings' | 'imports' | 'assembly' | 'decompiled'>('hex');
  const [hexOffsetSearch, setHexOffsetSearch] = useState('');
  const [selectedHexByte, setSelectedHexByte] = useState<{ offset: string; byte: number; idx: number } | null>({
    offset: '0x00401000',
    byte: 0x4d,
    idx: 0
  });

  // Strings filter state
  const [stringSearch, setStringSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Assembly & Decompile state
  const [selectedFunction, setSelectedFunction] = useState<string>('main_entry');
  const [copiedCode, setCopiedCode] = useState(false);

  const hexRows = useMemo(() => GENERATE_HEX_ROWS(0x00401000), []);

  const filteredStrings = useMemo(() => {
    return SAMPLE_STRINGS.filter(s => {
      const matchesSearch = stringSearch === '' || 
        s.value.toLowerCase().includes(stringSearch.toLowerCase()) ||
        s.offset.toLowerCase().includes(stringSearch.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [stringSearch, selectedCategory]);

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-900 dark:text-zinc-100 overflow-hidden select-none font-sans">
      {/* Header Bar */}
      <div className="shrink-0 border-b border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0D0E11] px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-white/[0.08] flex items-center justify-center border border-zinc-300 dark:border-white/[0.12] text-white">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold tracking-tight">Binary Lab</h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-300 font-bold border border-zinc-200 dark:border-white/[0.08]">
                TOP PRIORITY
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Inspect hex, extracted strings, symbol tables, disassembly, and neural decompiled pseudocode.
            </p>
          </div>
        </div>

        {/* Binary Selector & Quick Meta */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={selectedBinary.id}
              onChange={(e) => {
                const b = PRELOADED_BINARIES.find(x => x.id === e.target.value);
                if (b) setSelectedBinary(b);
              }}
              className="w-full sm:w-56 text-xs font-mono font-medium bg-zinc-100 dark:bg-[#141519] border border-zinc-200 dark:border-white/[0.08] rounded-lg px-3 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
            >
              {PRELOADED_BINARIES.map((bin) => (
                <option key={bin.id} value={bin.id}>
                  {bin.filename} ({bin.format})
                </option>
              ))}
            </select>
          </div>

          <label className="text-xs flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-dashed border-zinc-300 dark:border-white/[0.16] hover:bg-zinc-100 dark:hover:bg-white/[0.04] text-zinc-600 dark:text-zinc-300 cursor-pointer transition-colors">
            <FolderOpen className="w-3.5 h-3.5" />
            <span className="font-medium">Upload Binary</span>
            <input type="file" className="hidden" accept=".exe,.dll,.so,.elf,.sys,.dylib" />
          </label>
        </div>
      </div>

      {/* Target Metadata Banner */}
      <div className="shrink-0 bg-zinc-100/60 dark:bg-[#121317] border-b border-zinc-200 dark:border-white/[0.08] px-5 py-2 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs font-mono">
        <div className="flex items-center space-x-1.5">
          <span className="text-zinc-400 dark:text-zinc-500">FORMAT:</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedBinary.format}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-zinc-400 dark:text-zinc-500">ARCH:</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedBinary.arch}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-zinc-400 dark:text-zinc-500">SIZE:</span>
          <span className="text-zinc-700 dark:text-zinc-300">{selectedBinary.size}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-zinc-400 dark:text-zinc-500">SECTIONS:</span>
          <span className="text-zinc-700 dark:text-zinc-300">{selectedBinary.sectionsCount}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-zinc-400 dark:text-zinc-500">ENTROPY:</span>
          <span className={`font-bold ${selectedBinary.entropy > 7.0 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
            {selectedBinary.entropy} / 8.0 {selectedBinary.entropy > 7.0 ? '(Packed/Encrypted)' : '(Normal)'}
          </span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-zinc-400 dark:text-zinc-500">COMPILER:</span>
          <span className="text-zinc-700 dark:text-zinc-300">{selectedBinary.compiler}</span>
        </div>
        <div className="flex items-center space-x-2 ml-auto">
          {selectedBinary.mitigations.aslr && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-white/[0.12]">
              ASLR
            </span>
          )}
          {selectedBinary.mitigations.dep && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-white/[0.12]">
              DEP/NX
            </span>
          )}
          {selectedBinary.mitigations.cfg && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-white/[0.12]">
              CFG
            </span>
          )}
        </div>
      </div>

      {/* Subtab Navigation (Continuous Tabs Style) */}
      <div className="shrink-0 border-b border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0D0E11] px-5 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-1 bg-zinc-100 dark:bg-[#16171C] p-1 rounded-xl border border-zinc-200 dark:border-white/[0.06]">
          {[
            { id: 'hex', label: 'Hex Inspector', icon: Binary },
            { id: 'strings', label: 'Extracted Strings', icon: FileSearch },
            { id: 'imports', label: 'Imports & Exports', icon: Table },
            { id: 'assembly', label: 'Assembly (Disasm)', icon: Terminal },
            { id: 'decompiled', label: 'Decompiled C Code', icon: Code2 },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-zinc-900 dark:bg-white/[0.12] text-white dark:text-white shadow-xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col p-4">
        {/* 1. Hex Inspector View */}
        {activeSubTab === 'hex' && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 h-full overflow-hidden">
            {/* Hex Dump Area */}
            <div className="lg:col-span-3 flex flex-col bg-white dark:bg-[#0E0F13] border border-zinc-200 dark:border-white/[0.08] rounded-xl overflow-hidden shadow-xs">
              <div className="p-2.5 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#131418] flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-mono text-zinc-500">
                  <Hash className="w-3.5 h-3.5" />
                  <span>ADDRESS / OFFSET</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="w-3 h-3 absolute left-2 top-2 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Jump to offset (e.g. 0x401050)..."
                      value={hexOffsetSearch}
                      onChange={(e) => setHexOffsetSearch(e.target.value)}
                      className="pl-7 pr-2.5 py-1 text-xs font-mono bg-white dark:bg-[#1A1B20] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-800 dark:text-zinc-200 focus:outline-none w-52"
                    />
                  </div>
                </div>
              </div>

              {/* Hex Rows Container */}
              <div className="flex-1 overflow-auto p-3 font-mono text-xs leading-relaxed custom-scrollbar select-text">
                {/* Header Offsets */}
                <div className="flex text-zinc-400 dark:text-zinc-500 border-b border-zinc-200 dark:border-white/[0.06] pb-1.5 mb-1.5">
                  <span className="w-24 shrink-0 font-bold">Offset</span>
                  <div className="grid grid-cols-16 gap-x-1.5 sm:gap-x-2 flex-1 max-w-xl text-center">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <span key={i} className="text-zinc-400 dark:text-zinc-500">
                        {i.toString(16).toUpperCase().padStart(2, '0')}
                      </span>
                    ))}
                  </div>
                  <span className="w-40 shrink-0 ml-4 font-bold hidden md:block">Decoded Text</span>
                </div>

                {hexRows.map((row) => (
                  <div
                    key={row.offset}
                    className="flex items-center hover:bg-zinc-100/60 dark:hover:bg-white/[0.03] py-0.5 rounded px-1 group"
                  >
                    <span className="w-24 shrink-0 text-zinc-400 dark:text-zinc-500 select-none">
                      {row.offset}
                    </span>
                    <div className="grid grid-cols-16 gap-x-1.5 sm:gap-x-2 flex-1 max-w-xl text-center">
                      {row.hex.map((h, bIdx) => {
                        const isSelected = selectedHexByte?.offset === row.offset && selectedHexByte?.idx === bIdx;
                        const isZero = h === '00';
                        return (
                          <span
                            key={bIdx}
                            onClick={() => setSelectedHexByte({ offset: row.offset, byte: row.bytes[bIdx], idx: bIdx })}
                            className={`cursor-pointer rounded transition-colors px-0.5 ${
                              isSelected
                                ? 'bg-zinc-900 text-white dark:bg-white dark:text-black font-bold'
                                : isZero
                                ? 'text-zinc-400 dark:text-zinc-600'
                                : 'text-zinc-800 dark:text-zinc-200 font-medium group-hover:text-zinc-900 dark:group-hover:text-white'
                            }`}
                          >
                            {h}
                          </span>
                        );
                      })}
                    </div>
                    <span className="w-40 shrink-0 ml-4 tracking-widest text-zinc-600 dark:text-zinc-400 hidden md:block border-l border-zinc-200 dark:border-white/[0.06] pl-3">
                      {row.ascii}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Pane: Inspector Panel */}
            <div className="flex flex-col bg-white dark:bg-[#0E0F13] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-4 overflow-y-auto custom-scrollbar">
              <div className="flex items-center space-x-2 pb-3 border-b border-zinc-200 dark:border-white/[0.08]">
                <Eye className="w-4 h-4 text-zinc-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-700 dark:text-zinc-300">
                  Byte Inspector
                </h3>
              </div>

              <div className="mt-4 space-y-3 font-mono text-xs">
                <div>
                  <span className="text-zinc-400 dark:text-zinc-500 block text-[10px] uppercase">Selected Target</span>
                  <p className="font-bold text-zinc-900 dark:text-white text-sm">
                    {selectedHexByte?.offset} [+0x{selectedHexByte?.idx.toString(16).toUpperCase()}]
                  </p>
                </div>

                <div className="p-3 bg-zinc-50 dark:bg-[#141519] rounded-lg border border-zinc-200 dark:border-white/[0.06] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">Hex Value:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      0x{(selectedHexByte?.byte ?? 0).toString(16).padStart(2, '0').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">Unsigned 8-bit:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedHexByte?.byte ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">Signed 8-bit:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {(selectedHexByte?.byte ?? 0) > 127 ? (selectedHexByte?.byte ?? 0) - 256 : selectedHexByte?.byte ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">Binary Bits:</span>
                    <span className="text-zinc-800 dark:text-zinc-200 text-[10px]">
                      {(selectedHexByte?.byte ?? 0).toString(2).padStart(8, '0')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">ASCII Char:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {(selectedHexByte?.byte ?? 0) >= 32 && (selectedHexByte?.byte ?? 0) <= 126
                        ? `'${String.fromCharCode(selectedHexByte?.byte ?? 0)}'`
                        : '<non-printable>'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-200 dark:border-white/[0.08] space-y-2">
                  <span className="text-zinc-400 dark:text-zinc-500 block text-[10px] uppercase font-bold">PE Header Scope</span>
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1">
                    <p><span className="text-zinc-400">Section:</span> .text (Executable Code)</p>
                    <p><span className="text-zinc-400">Permissions:</span> R-X (Read, Execute)</p>
                    <p><span className="text-zinc-400">Virtual Size:</span> 0x00016000 bytes</p>
                    <p><span className="text-zinc-400">Raw Data Offset:</span> 0x00000400</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Extracted Strings View */}
        {activeSubTab === 'strings' && (
          <div className="flex-1 flex flex-col bg-white dark:bg-[#0E0F13] border border-zinc-200 dark:border-white/[0.08] rounded-xl overflow-hidden shadow-xs">
            {/* Filter Bar */}
            <div className="p-3 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#131418] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search strings, URLs, APIs, registry keys..."
                    value={stringSearch}
                    onChange={(e) => setStringSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-white dark:bg-[#1A1B20] border border-zinc-200 dark:border-white/[0.08] rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto">
                {['ALL', 'URL', 'FILE_PATH', 'CRYPTO', 'API_NAME', 'REGISTRY', 'MESSAGE'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-[11px] font-mono px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-zinc-900 dark:bg-white/[0.12] text-white font-semibold'
                        : 'bg-zinc-100 dark:bg-[#1A1B20] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Strings Table */}
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-100/70 dark:bg-[#15161C] border-b border-zinc-200 dark:border-white/[0.08] text-zinc-500 uppercase text-[10px] sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-4 font-bold">Virtual Offset</th>
                    <th className="py-2.5 px-3 font-bold">Section</th>
                    <th className="py-2.5 px-3 font-bold">Type</th>
                    <th className="py-2.5 px-3 font-bold">Category</th>
                    <th className="py-2.5 px-4 font-bold">Decoded String Content</th>
                    <th className="py-2.5 px-3 font-bold text-right">Entropy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.04]">
                  {filteredStrings.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="py-2 px-4 text-zinc-400 dark:text-zinc-500 font-semibold">{item.offset}</td>
                      <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">{item.section}</td>
                      <td className="py-2 px-3 text-zinc-500">{item.encoding}</td>
                      <td className="py-2 px-3">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                          item.category === 'URL' ? 'bg-zinc-100 dark:bg-white/[0.08] border-zinc-300 dark:border-white/[0.12] text-zinc-800 dark:text-zinc-200' :
                          item.category === 'CRYPTO' ? 'bg-zinc-100 dark:bg-white/[0.08] border-zinc-300 dark:border-white/[0.12] text-zinc-800 dark:text-zinc-200' :
                          item.category === 'API_NAME' ? 'bg-zinc-100 dark:bg-white/[0.08] border-zinc-300 dark:border-white/[0.12] text-zinc-800 dark:text-zinc-200' :
                          'bg-zinc-100 dark:bg-white/[0.06] border-zinc-200 dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400'
                        }`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-zinc-800 dark:text-zinc-200 font-medium select-text break-all">
                        {item.value}
                      </td>
                      <td className="py-2 px-3 text-right text-zinc-500 tabular-nums">
                        {item.entropy.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Imports & Exports View */}
        {activeSubTab === 'imports' && (
          <div className="flex-1 flex flex-col bg-white dark:bg-[#0E0F13] border border-zinc-200 dark:border-white/[0.08] rounded-xl overflow-hidden shadow-xs">
            <div className="p-3 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#131418] flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                PE/ELF DYNAMIC IMPORT ADDRESS TABLE (IAT)
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                Total API Imports: {SAMPLE_IMPORTS.length}
              </span>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-100/70 dark:bg-[#15161C] border-b border-zinc-200 dark:border-white/[0.08] text-zinc-500 uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4 font-bold">Module / DLL</th>
                    <th className="py-2.5 px-4 font-bold">Imported Function Symbol</th>
                    <th className="py-2.5 px-3 font-bold">Ordinal</th>
                    <th className="py-2.5 px-3 font-bold">RVA</th>
                    <th className="py-2.5 px-4 font-bold">Behavior Classification</th>
                    <th className="py-2.5 px-3 font-bold">Risk Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.04]">
                  {SAMPLE_IMPORTS.map((imp, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-4 font-bold text-zinc-800 dark:text-zinc-200">{imp.dll}</td>
                      <td className="py-2.5 px-4 font-semibold text-zinc-900 dark:text-white">{imp.function}</td>
                      <td className="py-2.5 px-3 text-zinc-500">#{imp.ordinal}</td>
                      <td className="py-2.5 px-3 text-zinc-400 dark:text-zinc-500">{imp.rva}</td>
                      <td className="py-2.5 px-4 text-zinc-600 dark:text-zinc-400">{imp.category}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          imp.risk === 'HIGH'
                            ? 'bg-zinc-200 dark:bg-white/[0.12] border-zinc-300 dark:border-white/[0.16] text-zinc-900 dark:text-zinc-100'
                            : imp.risk === 'MEDIUM'
                            ? 'bg-zinc-100 dark:bg-white/[0.06] border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300'
                            : 'bg-zinc-50 dark:bg-white/[0.03] border-zinc-200 dark:border-white/[0.05] text-zinc-500'
                        }`}>
                          {imp.risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Assembly (Disassembly) View */}
        {activeSubTab === 'assembly' && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden">
            {/* Function List Sidebar */}
            <div className="bg-white dark:bg-[#0E0F13] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-3 flex flex-col overflow-hidden">
              <div className="pb-2 border-b border-zinc-200 dark:border-white/[0.08] mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-zinc-400">
                  RECONSTRUCTED SYMBOLS
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                {Object.keys(SAMPLE_ASM_FUNCTIONS).map((func) => (
                  <button
                    key={func}
                    onClick={() => setSelectedFunction(func)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer flex items-center justify-between ${
                      selectedFunction === func
                        ? 'bg-zinc-900 dark:bg-white/[0.12] text-white font-bold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="truncate">{func}</span>
                    <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />
                  </button>
                ))}
              </div>
            </div>

            {/* Disassembly Canvas */}
            <div className="lg:col-span-3 bg-white dark:bg-[#0E0F13] border border-zinc-200 dark:border-white/[0.08] rounded-xl flex flex-col overflow-hidden">
              <div className="p-3 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#131418] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">
                    Disassembly: {selectedFunction}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-zinc-400">
                  Architecture: Intel x86-64 (AMD64)
                </span>
              </div>

              <div className="flex-1 overflow-auto p-3 font-mono text-xs custom-scrollbar select-text space-y-0.5">
                {(SAMPLE_ASM_FUNCTIONS[selectedFunction] || []).map((ins, idx) => (
                  <div
                    key={idx}
                    className="flex items-baseline py-0.5 hover:bg-zinc-100/60 dark:hover:bg-white/[0.03] rounded px-1 group"
                  >
                    <span className="w-28 text-zinc-400 dark:text-zinc-500 select-none">{ins.offset}</span>
                    <span className="w-36 text-zinc-500 dark:text-zinc-600 text-[11px] select-none">{ins.bytes}</span>
                    <span className="w-16 font-bold text-zinc-900 dark:text-zinc-100">{ins.mnemonic}</span>
                    <span className="w-64 text-zinc-700 dark:text-zinc-300">{ins.operands}</span>
                    {ins.comment && (
                      <span className="text-zinc-400 dark:text-zinc-500 italic text-[11px]">
                        ; {ins.comment}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. Decompiled C Pseudocode View */}
        {activeSubTab === 'decompiled' && (
          <div className="flex-1 flex flex-col bg-white dark:bg-[#0E0F13] border border-zinc-200 dark:border-white/[0.08] rounded-xl overflow-hidden shadow-xs">
            <div className="p-3 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#131418] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">
                  Target: {selectedFunction}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-200 dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 font-mono">
                  AST Reconstructed C
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopyCode(SAMPLE_DECOMPILED_CODE[selectedFunction] || '')}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
                  <span>{copiedCode ? 'Copied' : 'Copy Pseudocode'}</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-zinc-950 text-zinc-100 font-mono text-xs leading-relaxed custom-scrollbar select-text">
              <pre className="whitespace-pre">
                {SAMPLE_DECOMPILED_CODE[selectedFunction] || '// No pseudocode available for this symbol'}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
