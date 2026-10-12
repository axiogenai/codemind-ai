import React, { useState } from 'react';
import {
  Activity,
  Terminal,
  Play,
  Pause,
  Search,
  Network,
  FolderOpen,
  Layers,
  CheckCircle2
} from 'lucide-react';

interface SyscallLog {
  time: string;
  tid: number;
  api: string;
  category: 'MEMORY' | 'FILE' | 'REGISTRY' | 'NETWORK' | 'PROCESS';
  arguments: string;
  returnValue: string;
  risk: 'SAFE' | 'NOTABLE' | 'SUSPICIOUS';
}

const SAMPLE_SYSCALLS: SyscallLog[] = [
  { time: '+0.012s', tid: 4120, api: 'NtAllocateVirtualMemory', category: 'MEMORY', arguments: 'Base: 0x00, Size: 0x10000, AllocType: MEM_COMMIT, Protect: PAGE_READWRITE', returnValue: 'STATUS_SUCCESS (0x0)', risk: 'SAFE' },
  { time: '+0.034s', tid: 4120, api: 'NtProtectVirtualMemory', category: 'MEMORY', arguments: 'Base: 0x140003000, Size: 0x4000, NewProtect: PAGE_EXECUTE_READ', returnValue: 'STATUS_SUCCESS (0x0)', risk: 'NOTABLE' },
  { time: '+0.056s', tid: 4124, api: 'RegOpenKeyExW', category: 'REGISTRY', arguments: 'hKey: HKEY_LOCAL_MACHINE, SubKey: L"SYSTEM\\CurrentControlSet\\Services\\Tcpip"', returnValue: 'ERROR_SUCCESS', risk: 'SAFE' },
  { time: '+0.082s', tid: 4120, api: 'NtCreateFile', category: 'FILE', arguments: 'Path: L"\\??\\C:\\ProgramData\\CodeMind\\runtime.lock", Access: GENERIC_WRITE, Share: 0', returnValue: 'STATUS_SUCCESS (0x0)', risk: 'SAFE' },
  { time: '+0.115s', tid: 4128, api: 'WSAStartup', category: 'NETWORK', arguments: 'Version: 2.2, lpWSAData: 0x7FFE20', returnValue: '0 (SUCCESS)', risk: 'SAFE' },
  { time: '+0.142s', tid: 4128, api: 'connect', category: 'NETWORK', arguments: 'Socket: 184, Addr: 10.14.0.22:8443 (AF_INET)', returnValue: '0 (CONNECTED)', risk: 'NOTABLE' },
  { time: '+0.180s', tid: 4128, api: 'WSASend', category: 'NETWORK', arguments: 'Socket: 184, BufferLen: 256 bytes, Flags: 0', returnValue: '0 (SUCCESS)', risk: 'NOTABLE' },
  { time: '+0.210s', tid: 4120, api: 'NtWriteFile', category: 'FILE', arguments: 'FileHandle: 0x3C, Bytes: 4096, Buffer: [Encrypted state chunk]', returnValue: 'STATUS_SUCCESS', risk: 'SAFE' },
  { time: '+0.245s', tid: 4124, api: 'CreateRemoteThread', category: 'PROCESS', arguments: 'ProcessHandle: 0xFFFFFFFF (Self), StartAddress: 0x140001000', returnValue: 'HANDLE: 0x48', risk: 'SUSPICIOUS' },
];

interface LoadedLibrary {
  name: string;
  path: string;
  baseAddress: string;
  size: string;
  signed: boolean;
  signer: string;
  mitigations: string;
}

const SAMPLE_LIBRARIES: LoadedLibrary[] = [
  { name: 'ntdll.dll', path: 'C:\\Windows\\System32\\ntdll.dll', baseAddress: '0x7FFD52100000', size: '2.14 MB', signed: true, signer: 'Microsoft Windows', mitigations: 'ASLR, DEP, CFG' },
  { name: 'kernel32.dll', path: 'C:\\Windows\\System32\\kernel32.dll', baseAddress: '0x7FFD51F00000', size: '812 KB', signed: true, signer: 'Microsoft Windows', mitigations: 'ASLR, DEP, CFG' },
  { name: 'bcrypt.dll', path: 'C:\\Windows\\System32\\bcrypt.dll', baseAddress: '0x7FFD4EE00000', size: '154 KB', signed: true, signer: 'Microsoft Windows', mitigations: 'ASLR, DEP, CFG' },
  { name: 'ws2_32.dll', path: 'C:\\Windows\\System32\\ws2_32.dll', baseAddress: '0x7FFD51B00000', size: '440 KB', signed: true, signer: 'Microsoft Windows', mitigations: 'ASLR, DEP, CFG' },
  { name: 'advapi32.dll', path: 'C:\\Windows\\System32\\advapi32.dll', baseAddress: '0x7FFD51700000', size: '710 KB', signed: true, signer: 'Microsoft Windows', mitigations: 'ASLR, DEP, CFG' },
];

interface SocketConnection {
  fd: number;
  proto: 'TCP' | 'UDP';
  localEndpoint: string;
  remoteEndpoint: string;
  state: 'ESTABLISHED' | 'LISTENING' | 'TIME_WAIT';
  bytesSent: string;
  bytesRecv: string;
}

const SAMPLE_SOCKETS: SocketConnection[] = [
  { fd: 184, proto: 'TCP', localEndpoint: '127.0.0.1:51240', remoteEndpoint: '10.14.0.22:8443', state: 'ESTABLISHED', bytesSent: '14.2 KB', bytesRecv: '48.1 KB' },
  { fd: 192, proto: 'TCP', localEndpoint: '0.0.0.0:9000', remoteEndpoint: '0.0.0.0:0', state: 'LISTENING', bytesSent: '0 B', bytesRecv: '0 B' },
];

export const RuntimeInspectorView: React.FC = () => {
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'syscalls' | 'libraries' | 'network' | 'files'>('syscalls');
  const [filterQuery, setFilterQuery] = useState('');

  return (
    <div className="flex flex-col h-full w-full bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-900 dark:text-zinc-100 overflow-hidden select-none font-sans">
      {/* Header Bar */}
      <div className="shrink-0 border-b border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0D0E11] px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-white/[0.08] flex items-center justify-center border border-zinc-300 dark:border-white/[0.12] text-white">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold tracking-tight">Runtime Inspector</h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-300 font-bold border border-zinc-200 dark:border-white/[0.08]">
                SANDBOX ENCLAVE
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Observe process execution, loaded dynamic libraries, file I/O operations, and network sockets.
            </p>
          </div>
        </div>

        {/* Runtime State Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer border ${
              isRunning
                ? 'bg-zinc-900 dark:bg-white/[0.12] text-white border-zinc-800 dark:border-white/[0.16]'
                : 'bg-zinc-100 dark:bg-[#16171C] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/[0.08]'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? 'RECORDING TELEMETRY' : 'PAUSED'}</span>
          </button>
        </div>
      </div>

      {/* Target Process Banner */}
      <div className="shrink-0 bg-zinc-100/60 dark:bg-[#121317] border-b border-zinc-200 dark:border-white/[0.08] px-5 py-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs font-mono">
        <div className="flex items-center space-x-1.5">
          <span className="text-zinc-400">TARGET PROCESS:</span>
          <span className="font-bold text-zinc-900 dark:text-white">daemon_agent.exe</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-zinc-400">PID:</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">4920</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-zinc-400">THREADS:</span>
          <span className="text-zinc-800 dark:text-zinc-200">6 Active</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-zinc-400">MEMORY (RSS):</span>
          <span className="text-zinc-800 dark:text-zinc-200">42.4 MB</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-zinc-400">SANDBOX ISOLATION:</span>
          <span className="font-bold text-zinc-800 dark:text-zinc-200">Hypervisor Enclave</span>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div className="shrink-0 border-b border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0D0E11] px-5 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-1 bg-zinc-100 dark:bg-[#16171C] p-1 rounded-xl border border-zinc-200 dark:border-white/[0.06]">
          {[
            { id: 'syscalls', label: 'Syscall & API Log', icon: Terminal },
            { id: 'libraries', label: 'Loaded Modules (.dll)', icon: Layers },
            { id: 'network', label: 'Active Sockets', icon: Network },
            { id: 'files', label: 'File & Registry I/O', icon: FolderOpen },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
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

        <div className="relative">
          <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search telemetry events..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="pl-8 pr-2.5 py-1 text-xs font-mono bg-zinc-100 dark:bg-[#141519] border border-zinc-200 dark:border-white/[0.08] rounded-md text-zinc-800 dark:text-zinc-200 focus:outline-none w-56"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        {/* Tab 1: Syscalls & API Log */}
        {activeTab === 'syscalls' && (
          <div className="bg-white dark:bg-[#0E0F13] border border-zinc-200 dark:border-white/[0.08] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-100/70 dark:bg-[#15161C] border-b border-zinc-200 dark:border-white/[0.08] text-zinc-500 uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4 font-bold">Timestamp</th>
                    <th className="py-2.5 px-3 font-bold">TID</th>
                    <th className="py-2.5 px-4 font-bold">API / Syscall</th>
                    <th className="py-2.5 px-3 font-bold">Domain</th>
                    <th className="py-2.5 px-4 font-bold">Intercepted Arguments</th>
                    <th className="py-2.5 px-3 font-bold">Return Code</th>
                    <th className="py-2.5 px-3 font-bold text-right">Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.04]">
                  {SAMPLE_SYSCALLS.filter(s =>
                    filterQuery === '' ||
                    s.api.toLowerCase().includes(filterQuery.toLowerCase()) ||
                    s.arguments.toLowerCase().includes(filterQuery.toLowerCase())
                  ).map((log, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-4 text-zinc-400 font-semibold">{log.time}</td>
                      <td className="py-2.5 px-3 text-zinc-500">{log.tid}</td>
                      <td className="py-2.5 px-4 font-bold text-zinc-900 dark:text-white">{log.api}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/[0.08]">
                          {log.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-zinc-700 dark:text-zinc-300 select-text max-w-md truncate">
                        {log.arguments}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-500">{log.returnValue}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                          log.risk === 'SUSPICIOUS'
                            ? 'bg-zinc-200 dark:bg-white/[0.12] border-zinc-300 dark:border-white/[0.16] text-zinc-900 dark:text-zinc-100'
                            : log.risk === 'NOTABLE'
                            ? 'bg-zinc-100 dark:bg-white/[0.06] border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300'
                            : 'bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.05] text-zinc-500'
                        }`}>
                          {log.risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Loaded Libraries */}
        {activeTab === 'libraries' && (
          <div className="bg-white dark:bg-[#0E0F13] border border-zinc-200 dark:border-white/[0.08] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-100/70 dark:bg-[#15161C] border-b border-zinc-200 dark:border-white/[0.08] text-zinc-500 uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4 font-bold">Module</th>
                    <th className="py-2.5 px-4 font-bold">Loaded Base Address</th>
                    <th className="py-2.5 px-3 font-bold">Virtual Size</th>
                    <th className="py-2.5 px-4 font-bold">Physical Filesystem Path</th>
                    <th className="py-2.5 px-4 font-bold">Digital Signature</th>
                    <th className="py-2.5 px-3 font-bold">Mitigations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.04]">
                  {SAMPLE_LIBRARIES.map((lib, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-4 font-bold text-zinc-900 dark:text-white">{lib.name}</td>
                      <td className="py-2.5 px-4 text-zinc-400 font-semibold">{lib.baseAddress}</td>
                      <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">{lib.size}</td>
                      <td className="py-2.5 px-4 text-zinc-500 select-text">{lib.path}</td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center space-x-1 text-zinc-700 dark:text-zinc-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{lib.signer}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-500">{lib.mitigations}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Active Sockets */}
        {activeTab === 'network' && (
          <div className="bg-white dark:bg-[#0E0F13] border border-zinc-200 dark:border-white/[0.08] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-100/70 dark:bg-[#15161C] border-b border-zinc-200 dark:border-white/[0.08] text-zinc-500 uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4 font-bold">Socket FD</th>
                    <th className="py-2.5 px-3 font-bold">Protocol</th>
                    <th className="py-2.5 px-4 font-bold">Local Endpoint</th>
                    <th className="py-2.5 px-4 font-bold">Remote Endpoint</th>
                    <th className="py-2.5 px-3 font-bold">State</th>
                    <th className="py-2.5 px-3 font-bold">Data Sent</th>
                    <th className="py-2.5 px-3 font-bold">Data Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.04]">
                  {SAMPLE_SOCKETS.map((sock, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-4 font-bold text-zinc-900 dark:text-white">FD #{sock.fd}</td>
                      <td className="py-2.5 px-3 text-zinc-500">{sock.proto}</td>
                      <td className="py-2.5 px-4 text-zinc-700 dark:text-zinc-300">{sock.localEndpoint}</td>
                      <td className="py-2.5 px-4 font-bold text-zinc-800 dark:text-zinc-200">{sock.remoteEndpoint}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 font-bold border border-zinc-200 dark:border-white/[0.08]">
                          {sock.state}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-500">{sock.bytesSent}</td>
                      <td className="py-2.5 px-3 text-zinc-500">{sock.bytesRecv}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: File & Registry I/O */}
        {activeTab === 'files' && (
          <div className="bg-white dark:bg-[#0E0F13] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-4 shadow-xs">
            <h3 className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 pb-2 border-b border-zinc-200 dark:border-white/[0.08] mb-3">
              PERSISTENT STORAGE & REGISTRY MUTATIONS
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#141519] border border-zinc-200 dark:border-white/[0.06] flex items-center justify-between">
                <div>
                  <span className="font-bold text-zinc-900 dark:text-white block">C:\ProgramData\CodeMind\runtime.lock</span>
                  <span className="text-[11px] text-zinc-500">File Handle Created (Exclusive Lock)</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-200 dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-300">
                  WRITE_EXCLUSIVE
                </span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#141519] border border-zinc-200 dark:border-white/[0.06] flex items-center justify-between">
                <div>
                  <span className="font-bold text-zinc-900 dark:text-white block">HKLM\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters</span>
                  <span className="text-[11px] text-zinc-500">Registry Key Read (MaxUserPort, TcpTimedWaitDelay)</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.04] text-zinc-500">
                  KEY_READ
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
