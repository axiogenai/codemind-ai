import React, { useState } from 'react';
import { Play, FileCode, Code2, Copy, Check } from 'lucide-react';
import type { TestSuiteGeneration } from '../types';
import { generateTestSuite } from '../services/api';

interface Props {
  projectId?: string;
}

export const TestGeneratorView: React.FC<Props> = () => {
  const [filePath, setFilePath] = useState('backend/main.py');
  const [testData, setTestData] = useState<TestSuiteGeneration | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const res = await generateTestSuite(filePath);
    setTestData(res);
    setLoading(false);
  };

  const handleCopy = () => {
    if (testData?.sample_generated_code) {
      navigator.clipboard.writeText(testData.sample_generated_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] p-8 overflow-y-auto space-y-6 bg-[#0A0A0A]">
      <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-white">
            <FileCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Autonomous Test Generation</h2>
            <p className="text-xs text-neutral-400">Generate Unit, Integration, API, Edge Case, and Fuzzing tests automatically.</p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-4">
        <label className="text-xs font-bold text-neutral-300 block">Target File Path</label>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="text"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white outline-none font-mono"
            placeholder="e.g. backend/main.py"
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-neutral-100 text-neutral-900 hover:bg-white font-bold text-xs border border-neutral-300 transition-all cursor-pointer flex items-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>{loading ? 'Generating Tests...' : 'Generate Test Suite'}</span>
          </button>
        </div>
      </div>

      {testData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-1">
              <span className="text-xs font-bold text-neutral-400 uppercase">Generated Tests</span>
              <p className="text-2xl font-black text-white">{testData.total_generated_tests} Test Cases</p>
            </div>
            <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-1">
              <span className="text-xs font-bold text-neutral-400 uppercase">Predicted Coverage</span>
              <p className="text-2xl font-black text-emerald-400">{testData.coverage_percentage}%</p>
            </div>
            <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-1">
              <span className="text-xs font-bold text-neutral-400 uppercase">Test Suite Types</span>
              <p className="text-xs text-neutral-300 mt-1 font-mono">
                {testData.test_types.unit_tests} Unit | {testData.test_types.integration_tests} Integration | {testData.test_types.fuzz_tests} Fuzz
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl border border-neutral-800 bg-[#121212] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Code2 className="w-4 h-4 text-neutral-400" /> Generated PyTest Code
              </h3>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-300 hover:text-white flex items-center space-x-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 font-mono text-xs text-neutral-200 overflow-x-auto leading-relaxed">
              {testData.sample_generated_code}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
