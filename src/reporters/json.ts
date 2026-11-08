import { AnalysisReport } from '../engine/analyzer.js';

export function reportJson(report: AnalysisReport): string {
  return JSON.stringify(report, null, 2);
}
