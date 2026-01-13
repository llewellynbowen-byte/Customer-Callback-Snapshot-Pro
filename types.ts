
export type AuditStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface TranscriptEntry {
  id: string;
  name: string;
  content: string;
  status: AuditStatus;
  result: string | null;
  error?: string;
  timestamp: number;
}

export interface ParseResult {
  title: string;
  content: string[];
}
