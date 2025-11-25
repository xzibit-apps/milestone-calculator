// components/home/ResultsPanel.tsx
import { TrendingUp, Info, Clock, Calendar, Truck, AlertTriangle, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { formatDate } from '@/lib/calculator';
import { MESSAGES } from '@/lib/constants';
import type { CalculationResult, ProjectInput } from '@/lib/types';
import ExportButtons from './ExportButtons';

interface ResultsPanelProps {
  result: CalculationResult | null;
  input: ProjectInput;
}

export default function ResultsPanel({ result, input }: ResultsPanelProps) {
  // Helper functions
  const getBucketColor = (bucket: string) => {
    switch (bucket) {
      case 'fast_track': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'standard': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'custom': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high_risk': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getBucketLabel = (bucket: string) => {
    switch (bucket) {
      case 'fast_track': return MESSAGES.BUCKET_FAST_TRACK;
      case 'standard': return MESSAGES.BUCKET_STANDARD;
      case 'custom': return MESSAGES.BUCKET_CUSTOM;
      case 'high_risk': return MESSAGES.BUCKET_HIGH_RISK;
      default: return bucket;
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'ok': return MESSAGES.RISK_OK;
      case 'tight': return MESSAGES.RISK_TIGHT;
      case 'high': return MESSAGES.RISK_HIGH;
      default: return MESSAGES.RISK_UNKNOWN;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'ok': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'tight': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="bg-[#0f172a]/90 backdrop-blur-2xl border border-[#203049]/60 rounded-2xl sm:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_48px_rgba(96,165,250,0.15)] transition-all duration-700 relative overflow-hidden group">
      <div className="absolute inset-0 bg-linear-to-br from-[#60a5fa]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      
      <div className="p-4 sm:p-6 lg:p-8 border-b border-[#203049]/50 bg-linear-to-r from-[#0f172a]/95 to-[#1e293b]/95 backdrop-blur-sm relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-[#60a5fa]/20 rounded-lg p-1.5 sm:p-2 border border-[#60a5fa]/30">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-[#60a5fa]" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">{MESSAGES.CALCULATED_SPECS}</h2>
          </div>
          {result && <div className="shrink-0"><ExportButtons input={input} result={result} /></div>}
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        {!result ? (
          <div className="text-center py-12 sm:py-16 lg:py-20 text-[#94a3b8]">
            <div className="bg-[#0b2545]/50 rounded-full p-4 sm:p-6 w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
              <Info className="h-10 w-10 sm:h-12 sm:w-12 text-[#60a5fa]/50" />
            </div>
            <p className="text-sm sm:text-base font-medium">{MESSAGES.NO_RESULTS}</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Complexity Index & Lead Bucket */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-linear-to-br from-[#0b2545] to-[#0f172a] backdrop-blur-md border border-[#203049] rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 hover:border-[#60a5fa]/60 hover:shadow-[0_8px_24px_rgba(96,165,250,0.25)] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-[#60a5fa]/10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                  <div className="text-[10px] sm:text-xs text-[#94a3b8] uppercase tracking-wider mb-2 sm:mb-3 font-semibold">{MESSAGES.COMPLEXITY_INDEX}</div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#60a5fa] group-hover:scale-110 transition-transform inline-block drop-shadow-[0_0_15px_rgba(96,165,250,0.4)]">{result.ci}</div>
                </div>
              </div>
              <div className={`border rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 backdrop-blur-md hover:shadow-[0_8px_24px_rgba(96,165,250,0.25)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden ${getBucketColor(result.leadBucket)}`}>
                <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                  <div className="text-[10px] sm:text-xs text-[#94a3b8] uppercase tracking-wider mb-2 sm:mb-3 font-semibold">{MESSAGES.LEAD_BUCKET}</div>
                  <div className="text-base sm:text-lg lg:text-xl font-extrabold text-white wrap-break-word">{getBucketLabel(result.leadBucket)}</div>
                </div>
              </div>
            </div>

            {/* Phase Durations */}
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#60a5fa]" />
                <h3 className="text-xs sm:text-sm text-[#e2e8f0] font-bold uppercase tracking-wider">{MESSAGES.PHASE_DURATIONS}</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-linear-to-br from-[#0b2545] to-[#0f172a] backdrop-blur-md border border-[#203049] rounded-lg sm:rounded-xl p-3 sm:p-4 hover:border-[#60a5fa]/60 hover:shadow-[0_4px_16px_rgba(96,165,250,0.25)] hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#60a5fa]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <div className="text-[10px] sm:text-xs text-[#94a3b8] mb-1.5 sm:mb-2 font-medium">{MESSAGES.PHASE_DESIGN}</div>
                    <div className="text-xl sm:text-2xl font-extrabold text-white group-hover:scale-110 transition-transform inline-block">{result.durations.designDays}</div>
                  </div>
                </div>
                <div className="bg-linear-to-br from-[#0b2545] to-[#0f172a] backdrop-blur-md border border-[#203049] rounded-xl p-4 hover:border-[#60a5fa]/60 hover:shadow-[0_4px_16px_rgba(96,165,250,0.25)] hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#60a5fa]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <div className="text-xs text-[#94a3b8] mb-2 font-medium">{MESSAGES.PHASE_REVIEW}</div>
                    <div className="text-2xl font-extrabold text-white group-hover:scale-110 transition-transform inline-block">{result.durations.clientReviewDays}</div>
                  </div>
                </div>
                <div className="bg-linear-to-br from-[#0b2545] to-[#0f172a] backdrop-blur-md border border-[#203049] rounded-xl p-4 hover:border-[#60a5fa]/60 hover:shadow-[0_4px_16px_rgba(96,165,250,0.25)] hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#60a5fa]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <div className="text-xs text-[#94a3b8] mb-2 font-medium">{MESSAGES.PHASE_BUFFER}</div>
                    <div className="text-2xl font-extrabold text-white group-hover:scale-110 transition-transform inline-block">{result.durations.approvalBufferDays}</div>
                  </div>
                </div>
                <div className="bg-linear-to-br from-[#0b2545] to-[#0f172a] backdrop-blur-md border border-[#203049] rounded-xl p-4 hover:border-[#60a5fa]/60 hover:shadow-[0_4px_16px_rgba(96,165,250,0.25)] hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#60a5fa]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <div className="text-xs text-[#94a3b8] mb-2 font-medium">{MESSAGES.PHASE_PROCUREMENT}</div>
                    <div className="text-2xl font-extrabold text-white group-hover:scale-110 transition-transform inline-block">{result.durations.procurementDays}</div>
                  </div>
                </div>
                <div className="bg-linear-to-br from-[#0b2545] to-[#0f172a] backdrop-blur-md border border-[#203049] rounded-xl p-4 hover:border-[#60a5fa]/60 hover:shadow-[0_4px_16px_rgba(96,165,250,0.25)] hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#60a5fa]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <div className="text-xs text-[#94a3b8] mb-2 font-medium">{MESSAGES.PHASE_PRODUCTION}</div>
                    <div className="text-2xl font-extrabold text-white group-hover:scale-110 transition-transform inline-block">{result.durations.productionDays}</div>
                  </div>
                </div>
                <div className="bg-linear-to-br from-[#0b2545] to-[#0f172a] backdrop-blur-md border border-[#203049] rounded-xl p-4 hover:border-[#60a5fa]/60 hover:shadow-[0_4px_16px_rgba(96,165,250,0.25)] hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#60a5fa]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10">
                    <div className="text-xs text-[#94a3b8] mb-2 font-medium">{MESSAGES.PHASE_QA_PACK}</div>
                    <div className="text-2xl font-extrabold text-white group-hover:scale-110 transition-transform inline-block">{result.durations.qaAndPackDays}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Milestones */}
            {result.milestones ? (
              <div>
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#60a5fa]" />
                  <h3 className="text-xs sm:text-sm text-[#e2e8f0] font-bold uppercase tracking-wider">{MESSAGES.MILESTONES}</h3>
                </div>
                <div className="space-y-2 sm:space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 bg-linear-to-r from-[#0b2545] to-[#0f172a] backdrop-blur-md border border-[#203049] rounded-lg sm:rounded-xl px-3 py-2 sm:px-5 sm:py-3 hover:border-[#60a5fa]/50 hover:shadow-[0_4px_12px_rgba(96,165,250,0.15)] transition-all duration-300 group">
                    <span className="text-xs sm:text-sm text-[#94a3b8] group-hover:text-[#e2e8f0] transition-colors">{MESSAGES.MILESTONE_DESIGN_START}</span>
                    <span className="text-xs sm:text-sm font-bold text-white">{formatDate(result.milestones.designStart)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 bg-linear-to-r from-[#0b2545] to-[#0f172a] backdrop-blur-md border border-[#203049] rounded-lg sm:rounded-xl px-3 py-2 sm:px-5 sm:py-3 hover:border-[#60a5fa]/50 hover:shadow-[0_4px_12px_rgba(96,165,250,0.15)] transition-all duration-300 group">
                    <span className="text-xs sm:text-sm text-[#94a3b8] group-hover:text-[#e2e8f0] transition-colors">{MESSAGES.MILESTONE_CLIENT_REVIEW_START}</span>
                    <span className="text-xs sm:text-sm font-bold text-white">{formatDate(result.milestones.clientReviewStart)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 bg-linear-to-r from-[#0b2545] to-[#0f172a] backdrop-blur-md border border-[#203049] rounded-lg sm:rounded-xl px-3 py-2 sm:px-5 sm:py-3 hover:border-[#60a5fa]/50 hover:shadow-[0_4px_12px_rgba(96,165,250,0.15)] transition-all duration-300 group">
                    <span className="text-xs sm:text-sm text-[#94a3b8] group-hover:text-[#e2e8f0] transition-colors">{MESSAGES.MILESTONE_APPROVAL_DEADLINE}</span>
                    <span className="text-xs sm:text-sm font-bold text-white">{formatDate(result.milestones.approvalDeadline)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 bg-linear-to-r from-[#0b2545] to-[#0f172a] backdrop-blur-md border border-[#203049] rounded-lg sm:rounded-xl px-3 py-2 sm:px-5 sm:py-3 hover:border-[#60a5fa]/50 hover:shadow-[0_4px_12px_rgba(96,165,250,0.15)] transition-all duration-300 group">
                    <span className="text-xs sm:text-sm text-[#94a3b8] group-hover:text-[#e2e8f0] transition-colors">{MESSAGES.MILESTONE_PROCUREMENT_START}</span>
                    <span className="text-xs sm:text-sm font-bold text-white">{formatDate(result.milestones.procurementStart)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 bg-linear-to-r from-[#0b2545] to-[#0f172a] backdrop-blur-md border border-[#203049] rounded-lg sm:rounded-xl px-3 py-2 sm:px-5 sm:py-3 hover:border-[#60a5fa]/50 hover:shadow-[0_4px_12px_rgba(96,165,250,0.15)] transition-all duration-300 group">
                    <span className="text-xs sm:text-sm text-[#94a3b8] group-hover:text-[#e2e8f0] transition-colors">{MESSAGES.MILESTONE_PRODUCTION_START}</span>
                    <span className="text-xs sm:text-sm font-bold text-white">{formatDate(result.milestones.productionStart)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 bg-linear-to-r from-[#0b2545] to-[#0f172a] backdrop-blur-md border border-[#203049] rounded-lg sm:rounded-xl px-3 py-2 sm:px-5 sm:py-3 hover:border-[#60a5fa]/50 hover:shadow-[0_4px_12px_rgba(96,165,250,0.15)] transition-all duration-300 group">
                    <span className="text-xs sm:text-sm text-[#94a3b8] group-hover:text-[#e2e8f0] transition-colors">{MESSAGES.MILESTONE_PRODUCTION_COMPLETE}</span>
                    <span className="text-xs sm:text-sm font-bold text-white">{formatDate(result.milestones.productionComplete)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 bg-linear-to-r from-[#0b2545] to-[#0f172a] backdrop-blur-md border border-[#203049] rounded-lg sm:rounded-xl px-3 py-2 sm:px-5 sm:py-3 hover:border-[#60a5fa]/50 hover:shadow-[0_4px_12px_rgba(96,165,250,0.15)] transition-all duration-300 group">
                    <span className="text-xs sm:text-sm text-[#94a3b8] group-hover:text-[#e2e8f0] transition-colors">{MESSAGES.MILESTONE_DISPATCH}</span>
                    <span className="text-xs sm:text-sm font-bold text-white">{formatDate(result.milestones.dispatch)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 bg-linear-to-r from-[#60a5fa]/20 via-[#3b82f6]/15 to-[#2563eb]/10 backdrop-blur-md border-2 border-[#60a5fa] rounded-lg sm:rounded-xl px-3 py-2.5 sm:px-5 sm:py-3.5 shadow-[0_4px_20px_rgba(96,165,250,0.3)] hover:shadow-[0_6px_24px_rgba(96,165,250,0.4)] transition-all duration-300">
                    <span className="text-xs sm:text-sm font-bold text-[#60a5fa] flex items-center gap-2">
                      <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {MESSAGES.MILESTONE_TRUCK_LEAVE}
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-[#60a5fa]">{formatDate(result.milestones.truckLeaveDate)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-linear-to-br from-[#0b2545] to-[#0f172a] backdrop-blur-md border border-[#203049] rounded-lg sm:rounded-xl p-4 sm:p-5">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="bg-yellow-400/20 rounded-lg p-1.5 sm:p-2 shrink-0">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-yellow-400 mb-1">{MESSAGES.TRUCK_LEAVE_DATE_REQUIRED_TITLE}</p>
                    <p className="text-[10px] sm:text-xs text-[#94a3b8] leading-relaxed">
                      {MESSAGES.TRUCK_LEAVE_DATE_REQUIRED_MESSAGE}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Risk Level */}
            {result.milestones && result.riskLevel !== 'unknown' && (
              <div className={`border rounded-xl sm:rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 ${getRiskColor(result.riskLevel)}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-white/10 rounded-lg p-1.5 sm:p-2">
                      {result.riskLevel === 'ok' && <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />}
                      {result.riskLevel === 'tight' && <Clock className="h-4 w-4 sm:h-5 sm:w-5" />}
                      {result.riskLevel === 'high' && <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />}
                    </div>
                    <span className="text-xs sm:text-sm font-bold">{MESSAGES.RISK_LEVEL}</span>
                  </div>
                  <span className="text-sm sm:text-base font-extrabold px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg bg-white/10">{getRiskLabel(result.riskLevel)}</span>
                </div>
              </div>
            )}

            {/* Info Completeness */}
            <div className="bg-linear-to-br from-[#0b2545] to-[#0f172a] backdrop-blur-md border border-[#203049] rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#60a5fa]" />
                  <span className="text-[10px] sm:text-xs text-[#94a3b8] uppercase tracking-wider font-semibold">{MESSAGES.INFORMATION_COMPLETENESS}</span>
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold text-[#60a5fa]">
                  {Math.round(result.infoCompleteness * 100)}%
                </span>
              </div>
              <div className="w-full bg-[#031022] rounded-full h-2 sm:h-2.5 mb-2 overflow-hidden">
                <div
                  className={`h-2 sm:h-2.5 rounded-full transition-all duration-500 ${
                    result.infoCompleteness === 1
                      ? 'bg-green-500'
                      : result.infoCompleteness >= 0.5
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${result.infoCompleteness * 100}%` }}
                />
              </div>
              <p className="text-[10px] sm:text-xs text-[#64748b] text-center font-medium">
                {Object.values(input.infoGates).filter(Boolean).length} of {Object.keys(input.infoGates).length} gates complete
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

