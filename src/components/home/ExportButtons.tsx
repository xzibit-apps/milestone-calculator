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
    <div style={{ display: 'flex', gap: 'var(--xz-s-2)' }}>
      <button
        type="button"
        onClick={() => exportToJSON(input, result)}
        className="btn btn--secondary"
        title="Export to JSON"
      >
        <FileJson className="h-4 w-4" aria-hidden="true" />
        <span>JSON</span>
      </button>
      <button
        type="button"
        onClick={() => exportToCSV(input, result)}
        className="btn btn--secondary"
        title="Export to CSV"
      >
        <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
        <span>CSV</span>
      </button>
      <button
        type="button"
        onClick={() => exportToPDF(input, result)}
        className="btn btn--secondary"
        title="Export to PDF"
      >
        <FileType className="h-4 w-4" aria-hidden="true" />
        <span>PDF</span>
      </button>
    </div>
  );
}
