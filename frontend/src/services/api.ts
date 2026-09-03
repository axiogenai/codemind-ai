import type { ProjectMeta, ProjectFile, KnowledgeGraphData, SecurityReport, ImpactAnalysis, ChatMessage } from '../types';

const getApiBase = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  }
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  if (isHttps) {
    return 'https://codemind-ai-qdgi.onrender.com/api';
  }
  const hostname = typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost';
  return `http://${hostname}:8000/api`;
};

async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (err) {
    // If hostname fails, attempt direct 127.0.0.1 or localhost fallback (JSON requests only)
    if (!options?.body || typeof options.body === 'string') {
      const altUrl = url.includes('localhost')
        ? url.replace('localhost', '127.0.0.1')
        : url.replace('127.0.0.1', 'localhost');
      return await fetch(altUrl, options);
    }
    throw err;
  }
}

export async function fetchProjects(): Promise<ProjectMeta[]> {
  try {
    const res = await safeFetch(`${getApiBase()}/projects`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Backend API offline');
  }
  return [];
}

export async function scanLocalDirectory(directoryPath: string): Promise<{
  project: ProjectMeta;
  files: ProjectFile[];
  knowledge_graph: KnowledgeGraphData;
  security: SecurityReport;
}> {
  const res = await safeFetch(`${getApiBase()}/projects/scan-local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ directory_path: directoryPath })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Failed to scan directory: ${directoryPath}`);
  }
  return await res.json();
}

export async function uploadProjectZip(zipFile: File): Promise<{
  project: ProjectMeta;
  files: ProjectFile[];
  knowledge_graph: KnowledgeGraphData;
  security: SecurityReport;
}> {
  const formData = new FormData();
  formData.append('file', zipFile);

  const baseUrl = getApiBase();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/projects/upload`, {
      method: 'POST',
      body: formData
    });
  } catch (err) {
    // Wait briefly and retry if backend server process was restarting
    await new Promise(r => setTimeout(r, 800));
    const retryUrl = `${baseUrl.includes('localhost') ? 'http://127.0.0.1:8000/api' : 'http://localhost:8000/api'}/projects/upload`;
    const retryData = new FormData();
    retryData.append('file', zipFile);
    res = await fetch(retryUrl, {
      method: 'POST',
      body: retryData
    });
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to parse uploaded ZIP file');
  }
  return await res.json();
}

export async function scrapeWebsiteUrl(url: string): Promise<{
  project: ProjectMeta;
  files: ProjectFile[];
  knowledge_graph: KnowledgeGraphData;
  security: SecurityReport;
}> {
  const res = await safeFetch(`${getApiBase()}/projects/scrape-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Failed to fetch website URL: ${url}`);
  }
  return await res.json();
}

export async function analyzeProject(projectId?: string): Promise<{
  project: ProjectMeta | null;
  files: ProjectFile[];
  knowledge_graph: KnowledgeGraphData;
  security: SecurityReport;
}> {
  try {
    const res = await safeFetch(`${getApiBase()}/projects/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId })
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Backend API offline');
  }

  return {
    project: null,
    files: [],
    knowledge_graph: { node_count: 0, edge_count: 0, nodes: [], links: [] },
    security: { health_score: 100, security_grade: 'A', maintainability_rating: 'A', total_issues: 0, vulnerabilities: [], code_smells: [], technical_debt_hours: 0 }
  };
}

export async function predictImpact(targetSymbol: string, projectId?: string): Promise<ImpactAnalysis> {
  try {
    const res = await safeFetch(`${getApiBase()}/impact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_symbol: targetSymbol, project_id: projectId })
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Backend API offline');
  }

  return {
    target: targetSymbol,
    risk_level: 'LOW',
    risk_color: '#10B981',
    blast_radius_score: 0,
    confidence_score: 95,
    affected_files_count: 0,
    affected_apis_count: 0,
    affected_tables_count: 0,
    affected_files: [],
    affected_apis: [],
    affected_tables: [],
    affected_tests: [],
    potential_breaking_changes: [],
    migration_strategy: []
  };
}

export async function sendAIChat(
  query: string,
  projectId?: string,
  symbolContext?: { label: string; file?: string; type?: string } | null
): Promise<ChatMessage> {
  try {
    const res = await safeFetch(`${getApiBase()}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, project_id: projectId, symbol_context: symbolContext })
    });
    if (res.ok) {
      const data = await res.json();
      return {
        sender: 'ai',
        text: data.answer,
        citations: data.citations,
        confidence: data.confidence,
        timestamp: new Date().toLocaleTimeString()
      };
    }
  } catch (err) {
    console.warn('Backend API offline');
  }

  return {
    sender: 'ai',
    text: `Please import or scan a codebase first to enable AI RAG context analysis.`,
    citations: [],
    confidence: 0,
    timestamp: new Date().toLocaleTimeString()
  };
}

export async function fetchDoc(docType: string, projectId?: string): Promise<string> {
  try {
    const res = await safeFetch(`${getApiBase()}/docs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doc_type: docType, project_id: projectId })
    });
    if (res.ok) {
      const data = await res.json();
      return data.content || data.markdown || '';
    }
  } catch (err) {
    console.warn('Backend API offline');
  }

  return `# Documentation unavailable\n\nPlease scan a project first.`;
}

export async function fetchPatentSpec(projectId?: string): Promise<{ title: string; patent_id: string; markdown: string; metrics: any }> {
  try {
    const res = await safeFetch(`${getApiBase()}/patent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend API offline');
  }
  return { title: 'Patent Specification', patent_id: 'US-PAT-0000000', markdown: '# Patent Specification Unavailable\n\nPlease scan or import a codebase first.', metrics: {} };
}

// --- 14 Next-Gen Intelligence API Handlers ---

export async function fetchCodeDNA(projectId?: string) {
  const res = await safeFetch(`${getApiBase()}/dna`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId })
  });
  return res.ok ? await res.json() : null;
}

export async function simulateArchitectureEvolution(scenario: string, projectId?: string) {
  const res = await safeFetch(`${getApiBase()}/simulate-evolution`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario, project_id: projectId })
  });
  return res.ok ? await res.json() : null;
}

export async function fetchRefactoringPlan(projectId?: string) {
  const res = await safeFetch(`${getApiBase()}/refactor/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId })
  });
  return res.ok ? await res.json() : { plans: [] };
}

export async function fetchEvolutionTimeline(projectId?: string) {
  const res = await safeFetch(`${getApiBase()}/timeline?project_id=${projectId || ''}`);
  return res.ok ? await res.json() : { timeline: [] };
}

export async function fetchDigitalTwin(projectId?: string) {
  const res = await safeFetch(`${getApiBase()}/digital-twin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId })
  });
  return res.ok ? await res.json() : { metrics: [] };
}

export async function fetchKnowledgeMemory(projectId?: string) {
  const res = await safeFetch(`${getApiBase()}/memory?project_id=${projectId || ''}`);
  return res.ok ? await res.json() : { modules: [] };
}

export async function fetchCrossRepoIntelligence(projectId?: string) {
  const res = await safeFetch(`${getApiBase()}/cross-repo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId })
  });
  return res.ok ? await res.json() : { services: [] };
}

export async function fetchTechDebtMetrics(projectId?: string) {
  const res = await safeFetch(`${getApiBase()}/tech-debt?project_id=${projectId || ''}`);
  return res.ok ? await res.json() : null;
}

export async function generateTestSuite(filePath: string, code?: string) {
  const res = await safeFetch(`${getApiBase()}/generate-tests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_path: filePath, code })
  });
  return res.ok ? await res.json() : null;
}

export async function analyzeRootCause(stackTrace: string, projectId?: string) {
  const res = await safeFetch(`${getApiBase()}/root-cause`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stack_trace: stackTrace, project_id: projectId })
  });
  return res.ok ? await res.json() : null;
}

export async function fetchEngineeringScore(projectId?: string) {
  const res = await safeFetch(`${getApiBase()}/engineering-score?project_id=${projectId || ''}`);
  return res.ok ? await res.json() : null;
}

export async function fetchDependencyRisk(projectId?: string) {
  const res = await safeFetch(`${getApiBase()}/dependency-risk?project_id=${projectId || ''}`);
  return res.ok ? await res.json() : { dependencies: [] };
}

export async function reviewPullRequest(title: string, diff: string, projectId?: string) {
  const res = await safeFetch(`${getApiBase()}/review-pr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, diff, project_id: projectId })
  });
  return res.ok ? await res.json() : null;
}

export async function fetchOrgKnowledgeGraph(projectId?: string) {
  const res = await safeFetch(`${getApiBase()}/org-graph?project_id=${projectId || ''}`);
  return res.ok ? await res.json() : { nodes: [], edges: [] };
}

// Phase 2 Repository Transformation API Helpers
export async function interpretTransformationPrompt(prompt: string, projectId?: string) {
  const res = await safeFetch(`${getApiBase()}/transform/interpret`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, project_id: projectId })
  });
  return res.ok ? await res.json() : null;
}

export async function planTransformation(prompt: string, projectId?: string) {
  const res = await safeFetch(`${getApiBase()}/transform/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, project_id: projectId })
  });
  return res.ok ? await res.json() : null;
}

export async function previewTransformation(prompt: string, projectId?: string) {
  const res = await safeFetch(`${getApiBase()}/transform/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, project_id: projectId })
  });
  return res.ok ? await res.json() : null;
}

export async function executeTransformation(plan: any, projectId?: string) {
  const res = await safeFetch(`${getApiBase()}/transform/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, project_id: projectId })
  });
  return res.ok ? await res.json() : null;
}

export async function downloadTransformedCodebase(plan: any, projectId?: string) {
  try {
    const res = await fetch(`${getApiBase()}/transform/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, project_id: projectId })
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transformed_codebase.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    }
  } catch (err) {
    console.error('Download failed', err);
  }
}

export async function rollbackTransformation(projectId?: string) {
  const res = await safeFetch(`${getApiBase()}/transform/rollback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId })
  });
  return res.ok ? await res.json() : null;
}

export async function fetchTransformationHistory(projectId?: string) {
  const res = await safeFetch(`${getApiBase()}/transform/history?project_id=${projectId || ''}`);
  return res.ok ? await res.json() : { history: [] };
}

export async function configureAiEngine(apiKey: string, provider: string = 'groq') {
  const res = await safeFetch(`${getApiBase()}/ai/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey, provider })
  });
  return res.ok ? await res.json() : null;
}

export async function getAiEngineStatus() {
  const res = await safeFetch(`${getApiBase()}/ai/config`);
  return res.ok ? await res.json() : null;
}
