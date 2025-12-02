// components/home/ExportButtons.tsx
import { FileJson, FileSpreadsheet, FileType } from 'lucide-react';
import { exportToJSON, exportToCSV, exportToPDF } from '@/lib/export';
import type { ProjectInput, CalculationResult } from '@/lib/types';

interface ExportButtonsProps {
  input: ProjectInput;
  result: CalculationResult;
}

export default function ExportButtons({ input, result }: ExportButtonsProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-2.5">
      <button
        onClick={() => exportToJSON(input, result)}
        className="group flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-linear-to-br from-[#0b2545] to-[#0f172a] hover:from-[#0f172a] hover:to-[#0b2545] border border-[#203049] hover:border-[#60a5fa]/60 rounded-xl backdrop-blur-md text-[#e2e8f0] hover:text-[#60a5fa] transition-all duration-300 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_16px_rgba(96,165,250,0.4)] hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden"
        title="Export to JSON"
      >
        <div className="absolute inset-0 bg-[#60a5fa]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <FileJson className="h-4 w-4 sm:h-5 sm:w-5 relative z-10 group-hover:scale-110 transition-transform duration-300" />
        <span className="hidden sm:inline text-xs sm:text-sm font-semibold relative z-10">
          JSON
        </span>
      </button>
      <button
        onClick={() => exportToCSV(input, result)}
        className="group flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-linear-to-br from-[#0b2545] to-[#0f172a] hover:from-[#0f172a] hover:to-[#0b2545] border border-[#203049] hover:border-[#60a5fa]/60 rounded-xl backdrop-blur-md text-[#e2e8f0] hover:text-[#60a5fa] transition-all duration-300 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_16px_rgba(96,165,250,0.4)] hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden"
        title="Export to CSV"
      >
        <div className="absolute inset-0 bg-[#60a5fa]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5 relative z-10 group-hover:scale-110 transition-transform duration-300" />
        <span className="hidden sm:inline text-xs sm:text-sm font-semibold relative z-10">
          CSV
        </span>
      </button>
      <button
        onClick={() => exportToPDF(input, result)}
        className="group flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-linear-to-br from-[#0b2545] to-[#0f172a] hover:from-[#0f172a] hover:to-[#0b2545] border border-[#203049] hover:border-[#60a5fa]/60 rounded-xl backdrop-blur-md text-[#e2e8f0] hover:text-[#60a5fa] transition-all duration-300 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_16px_rgba(96,165,250,0.4)] hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden"
        title="Export to PDF"
      >
        <div className="absolute inset-0 bg-[#60a5fa]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <FileType className="h-4 w-4 sm:h-5 sm:w-5 relative z-10 group-hover:scale-110 transition-transform duration-300" />
        <span className="hidden sm:inline text-xs sm:text-sm font-semibold relative z-10">
          PDF
        </span>
      </button>
    </div>
  );
}
