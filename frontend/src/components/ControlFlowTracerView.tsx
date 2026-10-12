import React, { useState } from 'react';
import {
  GitFork,
  ArrowDown,
  Activity,
  Workflow
} from 'lucide-react';

interface FunctionNode {
  id: string;
  name: string;
  module: string;
  complexity: number;
  callers: { name: string; offset: string; freq: string }[];
  callees: { name: string; offset: string; type: 'API' | 'INTERNAL' | 'VIRTUAL'; risk: 'SAFE' | 'MEDIUM' | 'HIGH' }[];
  basicBlocks: {
    id: string;
    label: string;
    type: 'ENTRY' | 'CONDITIONAL' | 'BRANCH_TRUE' | 'BRANCH_FALSE' | 'EXIT';
    instructions: string[];
    nextBlocks: string[];
  }[];
  dataFlow: {
    variable: string;
    source: string;
    sink: string;
    tainted: boolean;
    description: string;
  }[];
}

const FUNCTIONS_DATABASE: Record<string, FunctionNode> = {
  'auth_validate_token': {
    id: 'auth_validate_token',
    name: 'auth_validate_token(const char *token, size_t len)',
    module: 'auth_engine.c',
    complexity: 7,
    callers: [
      { name: 'dispatch_client_request()', offset: '0x140003A10', freq: 'High (every RPC)' },
      { name: 'websocket_handshake()', offset: '0x140005C20', freq: 'Medium' },
      { name: 'reauthenticate_session()', offset: '0x140008F40', freq: 'Low' }
    ],
    callees: [
      { name: 'BCryptVerifySignature()', offset: '0x140001090', type: 'API', risk: 'SAFE' },
      { name: 'hash_sha256_digest()', offset: '0x1400021A0', type: 'INTERNAL', risk: 'SAFE' },
      { name: 'extract_claims_json()', offset: '0x1400034B0', type: 'INTERNAL', risk: 'MEDIUM' },
      { name: 'log_security_audit()', offset: '0x140007800', type: 'INTERNAL', risk: 'SAFE' }
    ],
    basicBlocks: [
      {
        id: 'bb_0',
        label: 'loc_entry (Block 0)',
        type: 'ENTRY',
        instructions: ['push rbp', 'mov rbp, rsp', 'sub rsp, 30h', 'test rcx, rcx'],
        nextBlocks: ['bb_1']
      },
      {
        id: 'bb_1',
        label: 'loc_check_null (Block 1)',
        type: 'CONDITIONAL',
        instructions: ['jz loc_null_token_error', 'cmp rdx, 32', 'jl loc_len_too_short'],
        nextBlocks: ['bb_true', 'bb_false']
      },
      {
        id: 'bb_true',
        label: 'loc_parse_claims (Block 2 - Valid)',
        type: 'BRANCH_TRUE',
        instructions: ['lea r8, [rsp+20h]', 'call extract_claims_json', 'test eax, eax', 'jnz loc_verify_sig'],
        nextBlocks: ['bb_exit']
      },
      {
        id: 'bb_false',
        label: 'loc_reject_auth (Block 3 - Invalid)',
        type: 'BRANCH_FALSE',
        instructions: ['mov ecx, 0xC0000022', 'call log_security_audit', 'mov eax, ecx'],
        nextBlocks: ['bb_exit']
      },
      {
        id: 'bb_exit',
        label: 'loc_epilogue (Block 4)',
        type: 'EXIT',
        instructions: ['add rsp, 30h', 'pop rbp', 'ret'],
        nextBlocks: []
      }
    ],
    dataFlow: [
      {
        variable: 'token_input_ptr',
        source: 'Untrusted Network Socket (rcx)',
        sink: 'extract_claims_json()',
        tainted: true,
        description: 'Tainted user buffer directly parsed without sanitization check'
      },
      {
        variable: 'session_token_hash',
        source: 'hash_sha256_digest()',
        sink: 'BCryptVerifySignature()',
        tainted: false,
        description: 'Cryptographically bounded fixed 32-byte digest'
      },
      {
        variable: 'audit_log_msg',
        source: 'loc_reject_auth',
        sink: 'Syslog File Descriptor',
        tainted: false,
        description: 'Sanitized event telemetry'
      }
    ]
  },
  'dispatch_network_packet': {
    id: 'dispatch_network_packet',
    name: 'dispatch_network_packet(SOCKET sock, PacketBuffer *pkt)',
    module: 'net_worker.c',
    complexity: 11,
    callers: [
      { name: 'main_event_loop()', offset: '0x140001000', freq: 'High' }
    ],
    callees: [
      { name: 'recv()', offset: '0x140006058', type: 'API', risk: 'MEDIUM' },
      { name: 'decrypt_payload_block()', offset: '0x1400015E0', type: 'INTERNAL', risk: 'SAFE' },
      { name: 'VirtualAllocEx()', offset: '0x140006000', type: 'API', risk: 'HIGH' },
      { name: 'execute_handler_callback()', offset: '0x140004100', type: 'VIRTUAL', risk: 'HIGH' }
    ],
    basicBlocks: [
      {
        id: 'bb_0',
        label: 'loc_net_entry',
        type: 'ENTRY',
        instructions: ['mov [rsp+10h], rdx', 'sub rsp, 48h', 'mov rcx, [rdx+8]'],
        nextBlocks: ['bb_1']
      },
      {
        id: 'bb_1',
        label: 'loc_validate_magic',
        type: 'CONDITIONAL',
        instructions: ['cmp dword ptr [rcx], 0x504B5431', 'jne loc_drop_invalid'],
        nextBlocks: ['bb_true', 'bb_false']
      },
      {
        id: 'bb_true',
        label: 'loc_alloc_scratch',
        type: 'BRANCH_TRUE',
        instructions: ['call decrypt_payload_block', 'mov rcx, rax', 'call execute_handler_callback'],
        nextBlocks: ['bb_exit']
      },
      {
        id: 'bb_false',
        label: 'loc_drop_invalid',
        type: 'BRANCH_FALSE',
        instructions: ['mov eax, -1', 'call log_dropped_packet'],
        nextBlocks: ['bb_exit']
      },
      {
        id: 'bb_exit',
        label: 'loc_net_exit',
        type: 'EXIT',
        instructions: ['add rsp, 48h', 'ret'],
        nextBlocks: []
      }
    ],
    dataFlow: [
      {
        variable: 'raw_socket_bytes',
        source: 'recv() socket read',
        sink: 'VirtualAllocEx memory region',
        tainted: true,
        description: 'Direct arbitrary packet payload moved into executable or readable scratch buffer'
      }
    ]
  }
};

export const ControlFlowTracerView: React.FC = () => {
  const [selectedFunctionId, setSelectedFunctionId] = useState<string>('auth_validate_token');
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'cfg' | 'dataflow'>('hierarchy');
  const [depthLevel, setDepthLevel] = useState<number>(2);

  const currentFunc = FUNCTIONS_DATABASE[selectedFunctionId] || FUNCTIONS_DATABASE['auth_validate_token'];

  return (
    <div className="flex flex-col h-full w-full bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-900 dark:text-zinc-100 overflow-hidden select-none font-sans">
      {/* Header Bar */}
      <div className="shrink-0 border-b border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0D0E11] px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-white/[0.08] flex items-center justify-center border border-zinc-300 dark:border-white/[0.12] text-white">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold tracking-tight">Control Flow & Call Tracer</h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-300 font-bold border border-zinc-200 dark:border-white/[0.08]">
                XREF & AST
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Trace function callers, callees, branching logic, basic blocks, and tainted data flow paths.
            </p>
          </div>
        </div>

        {/* Function Selector */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={selectedFunctionId}
            onChange={(e) => setSelectedFunctionId(e.target.value)}
            className="w-full sm:w-72 text-xs font-mono font-medium bg-zinc-100 dark:bg-[#141519] border border-zinc-200 dark:border-white/[0.08] rounded-lg px-3 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
          >
            {Object.values(FUNCTIONS_DATABASE).map(f => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Function Overview Ribbon */}
      <div className="shrink-0 bg-zinc-100/60 dark:bg-[#121317] border-b border-zinc-200 dark:border-white/[0.08] px-5 py-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs font-mono">
        <div className="flex items-center space-x-1.5">
          <span className="text-zinc-400">MODULE:</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{currentFunc.module}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-zinc-400">CYCLOMATIC COMPLEXITY:</span>
          <span className="font-bold text-zinc-900 dark:text-white">{currentFunc.complexity}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-zinc-400">INBOUND CALLERS:</span>
          <span className="text-zinc-800 dark:text-zinc-200 font-bold">{currentFunc.callers.length}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-zinc-400">OUTBOUND CALLEES:</span>
          <span className="text-zinc-800 dark:text-zinc-200 font-bold">{currentFunc.callees.length}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-zinc-400">BASIC BLOCKS:</span>
          <span className="text-zinc-800 dark:text-zinc-200 font-bold">{currentFunc.basicBlocks.length}</span>
        </div>
      </div>

      {/* Subtabs Bar */}
      <div className="shrink-0 border-b border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0D0E11] px-5 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-1 bg-zinc-100 dark:bg-[#16171C] p-1 rounded-xl border border-zinc-200 dark:border-white/[0.06]">
          {[
            { id: 'hierarchy', label: 'Call Hierarchy (Callers / Callees)', icon: Workflow },
            { id: 'cfg', label: 'Control Flow Graph (CFG)', icon: GitFork },
            { id: 'dataflow', label: 'Data Flow & Taint Analysis', icon: Activity },
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

        {activeTab === 'hierarchy' && (
          <div className="flex items-center space-x-2 text-xs font-mono text-zinc-500">
            <span>Call Depth:</span>
            <div className="flex space-x-1">
              {[1, 2, 3, 4].map(d => (
                <button
                  key={d}
                  onClick={() => setDepthLevel(d)}
                  className={`px-2 py-0.5 rounded text-xs cursor-pointer ${
                    depthLevel === d
                      ? 'bg-zinc-900 dark:bg-white/[0.12] text-white font-bold'
                      : 'bg-zinc-100 dark:bg-[#181920] text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View Content */}
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        {/* Tab 1: Call Hierarchy */}
        {activeTab === 'hierarchy' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            {/* Left: Inbound Callers */}
            <div className="bg-white dark:bg-[#0E0F13] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-4 flex flex-col shadow-xs">
              <div className="pb-3 border-b border-zinc-200 dark:border-white/[0.08] flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                  INBOUND CALLERS (XREFs TO)
                </span>
                <span className="text-[11px] font-mono text-zinc-500">{currentFunc.callers.length} references</span>
              </div>
              <div className="mt-3 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                {currentFunc.callers.map((caller, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-zinc-50 dark:bg-[#141519] border border-zinc-200 dark:border-white/[0.06] rounded-lg font-mono text-xs hover:border-zinc-300 dark:hover:border-white/[0.12] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{caller.name}</span>
                      <span className="text-[10px] text-zinc-400">{caller.offset}</span>
                    </div>
                    <div className="mt-1 flex items-center space-x-1 text-[11px] text-zinc-500">
                      <span>Frequency:</span>
                      <span className="font-medium text-zinc-600 dark:text-zinc-400">{caller.freq}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Middle: Selected Function Focus Node */}
            <div className="bg-white dark:bg-[#0E0F13] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 dark:bg-white/[0.08] flex items-center justify-center border border-zinc-300 dark:border-white/[0.12] text-white mb-3">
                <Workflow className="w-7 h-7" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.08] mb-2">
                ACTIVE TRACER ROOT
              </span>
              <h3 className="text-sm font-bold font-mono text-zinc-900 dark:text-white px-2 break-all">
                {currentFunc.name}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 font-mono">
                Defined in: {currentFunc.module}
              </p>

              <div className="w-full mt-6 pt-4 border-t border-zinc-200 dark:border-white/[0.08] grid grid-cols-2 gap-2 text-left text-xs font-mono">
                <div className="p-2 bg-zinc-50 dark:bg-[#141519] rounded-lg">
                  <span className="text-[10px] text-zinc-400 block">CALL SITES</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{currentFunc.callers.length} Entry Points</span>
                </div>
                <div className="p-2 bg-zinc-50 dark:bg-[#141519] rounded-lg">
                  <span className="text-[10px] text-zinc-400 block">BLAST RADIUS</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{currentFunc.callees.length} Downstream APIs</span>
                </div>
              </div>
            </div>

            {/* Right: Outbound Callees */}
            <div className="bg-white dark:bg-[#0E0F13] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-4 flex flex-col shadow-xs">
              <div className="pb-3 border-b border-zinc-200 dark:border-white/[0.08] flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                  OUTBOUND CALLEES (XREFs FROM)
                </span>
                <span className="text-[11px] font-mono text-zinc-500">{currentFunc.callees.length} calls</span>
              </div>
              <div className="mt-3 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                {currentFunc.callees.map((callee, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-zinc-50 dark:bg-[#141519] border border-zinc-200 dark:border-white/[0.06] rounded-lg font-mono text-xs hover:border-zinc-300 dark:hover:border-white/[0.12] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{callee.name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                        callee.risk === 'HIGH'
                          ? 'bg-zinc-200 dark:bg-white/[0.12] border-zinc-300 dark:border-white/[0.16] text-zinc-900 dark:text-zinc-100'
                          : callee.risk === 'MEDIUM'
                          ? 'bg-zinc-100 dark:bg-white/[0.06] border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300'
                          : 'bg-zinc-50 dark:bg-white/[0.03] border-zinc-200 dark:border-white/[0.05] text-zinc-500'
                      }`}>
                        {callee.risk}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500">
                      <span>{callee.offset}</span>
                      <span className="text-[10px] px-1 bg-zinc-200 dark:bg-white/[0.06] rounded">{callee.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Control Flow Graph Basic Blocks */}
        {activeTab === 'cfg' && (
          <div className="flex flex-col items-center justify-start space-y-4 max-w-2xl mx-auto py-2">
            {currentFunc.basicBlocks.map((bb, idx) => (
              <React.Fragment key={bb.id}>
                <div className="w-full bg-white dark:bg-[#0E0F13] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-4 shadow-xs font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200 dark:border-white/[0.06]">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${
                        bb.type === 'ENTRY' ? 'bg-zinc-700 dark:bg-zinc-300' :
                        bb.type === 'EXIT' ? 'bg-zinc-500' : 'bg-zinc-400'
                      }`} />
                      <span className="font-bold text-zinc-900 dark:text-white">{bb.label}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.06] text-zinc-500 font-bold">
                      {bb.type}
                    </span>
                  </div>

                  <div className="space-y-1 text-zinc-700 dark:text-zinc-300">
                    {bb.instructions.map((ins, iIdx) => (
                      <div key={iIdx} className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                        {ins}
                      </div>
                    ))}
                  </div>

                  {bb.nextBlocks.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-zinc-200 dark:border-white/[0.06] flex items-center space-x-3 text-[11px] text-zinc-500">
                      <span>Jumps to:</span>
                      {bb.nextBlocks.map(nb => (
                        <span key={nb} className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-[#16171C] text-zinc-700 dark:text-zinc-300 font-bold border border-zinc-200 dark:border-white/[0.06]">
                          {nb}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {idx < currentFunc.basicBlocks.length - 1 && (
                  <ArrowDown className="w-4 h-4 text-zinc-400 dark:text-zinc-600 my-1" />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Tab 3: Data Flow & Taint Analysis */}
        {activeTab === 'dataflow' && (
          <div className="bg-white dark:bg-[#0E0F13] border border-zinc-200 dark:border-white/[0.08] rounded-xl overflow-hidden shadow-xs">
            <div className="p-3.5 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#131418] flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">
                  VARIABLE TAINT PROPAGATION & MEMORY SANITIZATION
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Monitors input vectors from unvalidated boundaries to critical API sinks.
                </p>
              </div>
              <span className="text-xs font-mono text-zinc-500 font-semibold">
                {currentFunc.dataFlow.length} Tracked State Channels
              </span>
            </div>

            <div className="divide-y divide-zinc-200 dark:divide-white/[0.06]">
              {currentFunc.dataFlow.map((df, idx) => (
                <div key={idx} className="p-4 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-zinc-900 dark:text-white text-sm">{df.variable}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        df.tainted
                          ? 'bg-zinc-200 dark:bg-white/[0.12] text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-white/[0.16]'
                          : 'bg-zinc-100 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/[0.06]'
                      }`}>
                        {df.tainted ? 'TAINTED / UNTRUSTED' : 'SANITIZED / FIXED'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-zinc-100/60 dark:bg-[#141519] border border-zinc-200 dark:border-white/[0.06]">
                      <span className="text-[10px] text-zinc-400 uppercase block font-semibold">Source Vector</span>
                      <span className="text-zinc-800 dark:text-zinc-200">{df.source}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-100/60 dark:bg-[#141519] border border-zinc-200 dark:border-white/[0.06]">
                      <span className="text-[10px] text-zinc-400 uppercase block font-semibold">Destination Sink</span>
                      <span className="text-zinc-800 dark:text-zinc-200">{df.sink}</span>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 font-sans">
                    {df.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
