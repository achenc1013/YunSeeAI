/**
 * Type declarations for YunSeeAI Scanner Module
 */

// Scanner Client Types
export interface ScanPortsResult {
  success: boolean;
  target?: string;
  target_ip?: string;
  open_ports?: Array<{
    port: number;
    service: string;
    state: string;
    banner?: string;
  }>;
  total_scanned?: number;
  total_open?: number;
  error?: string;
}

export interface ScanFingerprintResult {
  success: boolean;
  target?: string;
  technologies?: Array<{
    name: string;
    confidence: string;
    type: string;
    detected_path?: string;
  }>;
  server_info?: Record<string, string>;
  headers?: Record<string, string>;
  cookies?: string[];
  total_detected?: number;
  error?: string;
}

export interface ScanFullResult {
  success: boolean;
  target?: string;
  scan_type?: string;
  port_scan?: ScanPortsResult;
  fingerprint_scan?: ScanFingerprintResult;
  error?: string;
}

// Scanner Client Functions
export function scanPorts(
  target: string,
  ports?: string,
  timeout?: number
): Promise<ScanPortsResult>;

export function scanFingerprint(
  target: string,
  timeout?: number
): Promise<ScanFingerprintResult>;

export function scanFull(
  target: string,
  options?: { ports?: string; timeout?: number }
): Promise<ScanFullResult>;

export function formatScanResults(
  scanResult: ScanFullResult | ScanPortsResult | ScanFingerprintResult
): string;

// AI Integration Types
export interface ParsedIntent {
  success: boolean;
  tool?: string;
  intent?: string;
  target?: string;
  parameters?: Record<string, any>;
  error?: string;
}

export interface ProcessQueryResult {
  success: boolean;
  intent?: string;
  target?: string;
  tool_used?: string;
  raw_results?: any;
  formatted_results?: string;
  ai_response?: string;
  error?: string;
  message?: string;
}

export function parseIntent(userMessage: string): ParsedIntent;

export function processQuery(userMessage: string): Promise<ProcessQueryResult>;

export function generateResponse(
  intent: ParsedIntent,
  scanResult: any,
  formattedResults: string
): string;

export function getToolsForModel(): Array<{
  type: string;
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}>;

export const SCANNER_SYSTEM_PROMPT: string;

// Tools Registry Types
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  handler: (args: any) => Promise<any>;
}

export const SCANNER_TOOLS: ToolDefinition[];

export function executeTool(
  toolName: string,
  args: Record<string, any>
): Promise<any>;

export function getToolDefinitions(): Array<{
  type: string;
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}>;

// Default exports
declare const _default: {
  scanPorts: typeof scanPorts;
  scanFingerprint: typeof scanFingerprint;
  scanFull: typeof scanFull;
  formatScanResults: typeof formatScanResults;
  parseIntent: typeof parseIntent;
  processQuery: typeof processQuery;
  executeTool: typeof executeTool;
  getToolDefinitions: typeof getToolDefinitions;
};

export default _default;

// Semantic Intent Parser Types
declare module '../../scanner/semantic-intent-parser.js' {
  export function parseSemanticIntent(userMessage: string): ParsedIntent;
  export function clearContext(): void;
  export function getContext(): { lastTarget: string | null };
}

