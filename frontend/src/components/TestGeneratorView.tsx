import React, { useState } from 'react';
import { Play, FileCode, Code2, Copy, Check } from 'lucide-react';
import type { TestSuiteGeneration } from '../types';
import { generateTestSuite } from '../services/api';
import { SpotlightCard } from './ui/SpotlightCard';

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
    <div className="h-[calc(100vh-4rem)] p-6 md:p-8 overflow-y-auto space-y-6 bg-zinc-50 dark:bg-[#0A0A0A] transition-colors duration-200">
      <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-[#151619] border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200">
            <FileCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Autonomous Test Generation</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Generate Unit, Integration, API, Edge Case, and Fuzzing tests automatically.</p>
          </div>
        </div>
      </SpotlightCard>

      <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-4">
        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">Target File Path</label>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="text"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            className="flex-1 bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] rounded-xl px-4 py-3 text-xs text-zinc-900 dark:text-white outline-none font-mono"
            placeholder="e.g. backend/main.py"
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950 font-bold text-xs transition-all cursor-pointer flex items-center space-x-2 shadow-xs hover:scale-[1.01]"
          >
            <Play className="w-4 h-4" />
            <span>{loading ? 'Generating Tests...' : 'Generate Test Suite'}</span>
          </button>
        </div>
      </SpotlightCard>

      {testData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-1">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Generated Tests</span>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{testData.total_generated_tests} Test Cases</p>
            </SpotlightCard>
            <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-1">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Predicted Coverage</span>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">{testData.coverage_percentage}%</p>
            </SpotlightCard>
            <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-1">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Test Suite Types</span>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 font-mono">
                {testData.test_types.unit_tests} Unit | {testData.test_types.integration_tests} Integration | {testData.test_types.fuzz_tests} Fuzz
              </p>
            </SpotlightCard>
          </div>

          <SpotlightCard className="p-6 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Code2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" /> Generated PyTest Code
              </h3>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-[#151619] dark:hover:bg-zinc-800 border border-zinc-200 dark:border-white/[0.08] text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center space-x-1 cursor-pointer transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="p-5 rounded-2xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] font-mono text-xs text-zinc-800 dark:text-zinc-200 overflow-x-auto leading-relaxed">
              {testData.sample_generated_code}
            </pre>
          </SpotlightCard>
        </div>
      )}
    </div>
  );
};
