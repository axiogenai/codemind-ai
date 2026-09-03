export interface ProjectMeta {
  id: string;
  name: string;
  description: string;
  created_at: string;
  primary_language: string;
  framework: string;
  total_files: number;
  total_lines: number;
  health_score: number;
  security_grade: string;
  languages?: Record<string, number>;
  ast_tree?: any;
}

export interface ProjectFile {
  path: string;
  code: string;
  lines: number;
  language: string;
  symbols: {
    classes: string[];
    functions: string[];
    apis: string[];
    tables: string[];
    imports: string[];
  };
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  group?: number;
  cluster_id?: number;
  file?: string;
  embedding_vector?: number[];
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  relation: string;
}

export interface KnowledgeGraphData {
  node_count: number;
  edge_count: number;
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface SecurityIssue {
  id: string;
  file: string;
  line: number;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type?: string;
  title?: string;
  description: string;
  recommendation?: string;
}

export interface SecurityReport {
  health_score: number;
  security_grade: string;
  maintainability_rating?: string;
  total_issues?: number;
  technical_debt_hours: number;
  vulnerabilities: SecurityIssue[];
  code_smells: SecurityIssue[];
}

export interface ImpactAnalysis {
  target: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_color: string;
  blast_radius_score: number;
  confidence_score: number;
  affected_files_count: number;
  affected_apis_count: number;
  affected_tables_count: number;
  affected_files: string[];
  affected_apis: string[];
  affected_tables: string[];
  affected_tests?: string[];
  migration_strategy?: string[];
  potential_breaking_changes?: string[];
  test_requirements?: string[];
  breaking_changes?: string[];
}

export interface ChatMessage {
  id?: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  confidence?: number;
  citations?: Array<string | { file: string; line: number; snippet?: string }>;
}

export interface CodeDNAData {
  architecture_fingerprint: string;
  coding_style: string;
  design_patterns: string[];
  architecture_philosophy: string;
  naming_conventions: string;
  error_handling_strategy: string;
  dependency_philosophy: string;
  maturity_score: number;
  maturity_level: string;
  recommendations: string[];
}

export interface ArchitectureSimulationData {
  scenario: string;
  complexity_increase: string;
  performance_impact: string;
  technical_debt_delta: string;
  maintainability_score_after: number;
  suggested_steps: string[];
}

export interface RefactoringItem {
  id: string;
  title: string;
  type: 'DEAD_CODE' | 'EXTRACT_SERVICE' | 'MERGE_DUPLICATE' | 'CIRCULAR_DEP' | 'RENAME_SYMBOL';
  target_file: string;
  impact_risk: 'LOW' | 'MEDIUM' | 'HIGH';
  estimated_gain: string;
  verification_steps: string[];
}

export interface TimelineEvent {
  date: string;
  title: string;
  category: 'ARCHITECTURE' | 'MODULE_ADDED' | 'MODULE_REMOVED' | 'SECURITY_FIX' | 'DEBT_SPIKE' | 'BUG_HOTSPOT';
  description: string;
  author: string;
  files_changed: number;
}

export interface DigitalTwinMetric {
  component: string;
  request_flow: string;
  predicted_cpu: string;
  predicted_memory: string;
  predicted_network: string;
  deadlock_risk: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  bottleneck_warning?: string;
}

export interface ModuleMemoryBank {
  module_name: string;
  last_modified_by: string;
  dependencies: string[];
  known_issues: string[];
  related_apis: string[];
  security_score: number;
}

export interface CrossRepoNode {
  service_name: string;
  type: 'FRONTEND' | 'API_GATEWAY' | 'MICROSERVICE' | 'DATABASE' | 'SHARED_LIB';
  language: string;
  dependencies_on: string[];
}

export interface TechDebtMetrics {
  debt_score_pct: number;
  estimated_fix_hours: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  highest_roi_refactors: Array<{
    component: string;
    debt_hours: number;
    roi_rating: string;
    impact_description: string;
  }>;
}

export interface TestSuiteGeneration {
  target_file: string;
  total_generated_tests: number;
  coverage_percentage: number;
  test_types: {
    unit_tests: number;
    integration_tests: number;
    api_tests: number;
    edge_cases: number;
    fuzz_tests: number;
  };
  sample_generated_code: string;
}

export interface RootCauseTrace {
  stack_trace_query: string;
  matched_function: string;
  matched_file: string;
  database_query: string;
  related_commit: string;
  likely_root_cause: string;
  recommended_fix: string;
}

export interface EngineeringScore {
  maintainability: number;
  architecture: number;
  security: number;
  scalability: number;
  complexity: number;
  documentation: number;
  testing: number;
  overall: number;
}

export interface DependencyRiskItem {
  package_name: string;
  version: string;
  security_risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  license: string;
  maintenance_status: string;
  update_urgency: 'NONE' | 'LOW' | 'HIGH' | 'IMMEDIATE';
  breaking_change_risk: string;
}

export interface PRReviewResult {
  pr_title: string;
  intent_summary: string;
  architectural_consistency: string;
  security_issues: string[];
  performance_regressions: string[];
  merge_conflict_prediction: string;
  verdict: 'APPROVED' | 'NEEDS_CHANGES' | 'REJECTED';
}

export interface OrgKnowledgeNode {
  id: string;
  label: string;
  type: 'DEVELOPER' | 'COMMIT' | 'ISSUE' | 'API' | 'DATABASE' | 'CUSTOMER_FEATURE' | 'INCIDENT';
}

export interface OrgKnowledgeEdge {
  source: string;
  target: string;
  relation: string;
}

// Phase 2 Repository Transformation Engine Interfaces
export interface TransformationGoal {
  user_prompt: string;
  transformation_type: string;
  goal: string;
  source_symbol: string;
  target_symbol: string;
  constraints: string[];
  target_language: string;
}

export interface TransformationPlan {
  plan_id: string;
  goal: string;
  transformation_type: string;
  feature_name?: string;
  source_symbol: string;
  target_symbol: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence_percentage: number;
  estimated_execution_time_seconds: number;
  total_affected_files_count: number;
  affected_files: string[];
  created_files: string[];
  deleted_files: string[];
  renamed_files: Array<{ from: string; to: string }>;
  affected_symbols: string[];
  breaking_changes: string[];
  architectural_impact: string;
  performance_impact: string;
  maintainability_impact: string;
}

export interface ASTTransformationResult {
  transformation_type?: string;
  modified_files: Array<{
    path: string;
    original_code: string;
    transformed_code: string;
    diff: string;
    lines_added: number;
    lines_removed: number;
  }>;
  created_files: Array<{
    path: string;
    code: string;
    diff: string;
  }>;
  deleted_files: string[];
  combined_git_diff?: string;
  explanation?: {
    summary: string;
    commit_message: string;
  };
}

export interface ValidationReport {
  is_valid: boolean;
  validation_status: 'PASSED' | 'FAILED';
  syntax_validation: {
    total_checked: number;
    passed: number;
    failed: number;
    errors: any[];
  };
  ast_integrity_check: string;
  type_check_status: string;
  security_rescan: string;
  regression_analysis: string;
  recalculated_health_score: number;
}

export interface TransformationSnapshot {
  snapshot_id: string;
  timestamp: string;
  total_files: number;
}
