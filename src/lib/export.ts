// lib/export.ts
import type { ProjectInput, CalculationResult } from './types';
import { formatDate } from './calculator';

export interface ExportData {
  project: {
    projectName: string;
    clientName: string;
    truckLeaveDate: string | null;
  };
  inputs: {
    buildType: string;
    standSize: string;
    avComplexity: string;
    fabricationIntensity: string;
    briefClarity: string;
    engineeringRequired: boolean;
    longLeadItems: boolean;
  };
  calculation: {
    complexityIndex: number;
    bucket: string;
    informationCompleteness: number;
    leadBucket?: string;
    riskLevel?: string;
  };
  tasks: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    successFactor: string;
  }>;
  phaseDurations?: {
    designDays: number;
    clientReviewDays: number;
    approvalBufferDays: number;
    procurementDays: number;
    productionDays: number;
    qaAndPackDays: number;
  };
  milestones?: {
    designStart: string;
    clientReviewStart: string;
    approvalDeadline: string;
    procurementStart: string;
    productionStart: string;
    productionComplete: string;
    dispatch: string;
    truckLeaveDate: string;
  } | null;
  informationGates: {
    finalDrawings: boolean;
    finishesConfirmed: boolean;
    brandingAssets: boolean;
    avInputsConfirmed: boolean;
    engineeringSignedOff: boolean;
    clientScopeApproved: boolean;
  };
  exportedAt: string;
}

export function prepareExportData(
  input: ProjectInput,
  result: CalculationResult
): ExportData {
  return {
    project: {
      projectName: input.projectName || 'Untitled Project',
      clientName: input.clientName || 'Unknown Client',
      truckLeaveDate: input.truckLeaveDate,
    },
    inputs: {
      buildType: input.buildType,
      standSize: input.standSize,
      avComplexity: input.avComplexity,
      fabricationIntensity: input.fabricationIntensity,
      briefClarity: input.briefClarity,
      engineeringRequired: input.engineeringRequired,
      longLeadItems: input.longLeadItems,
    },
    calculation: {
      complexityIndex: result.ci,
      bucket: result.bucket || result.leadBucket || 'unknown',
      informationCompleteness: result.infoCompleteness,
      leadBucket: result.leadBucket,
      riskLevel: result.riskLevel,
    },
    tasks: result.tasks.map(task => ({
      id: task.id,
      name: task.name,
      startDate: formatDate(task.startDate),
      endDate: formatDate(task.endDate),
      successFactor: task.successFactor,
    })),
    phaseDurations: result.durations,
    milestones: result.milestones
      ? {
          designStart: formatDate(result.milestones.designStart),
          clientReviewStart: formatDate(result.milestones.clientReviewStart),
          approvalDeadline: formatDate(result.milestones.approvalDeadline),
          procurementStart: formatDate(result.milestones.procurementStart),
          productionStart: formatDate(result.milestones.productionStart),
          productionComplete: formatDate(result.milestones.productionComplete),
          dispatch: formatDate(result.milestones.dispatch),
          truckLeaveDate: formatDate(result.milestones.truckLeaveDate),
        }
      : null,
    informationGates: input.infoGates,
    exportedAt: new Date().toISOString(),
  };
}

export function exportToJSON(input: ProjectInput, result: CalculationResult): void {
  const data = prepareExportData(input, result);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.project.projectName.replace(/[^a-z0-9]/gi, '_')}_milestone_calculation.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCSV(input: ProjectInput, result: CalculationResult): void {
  const data = prepareExportData(input, result);
  const projectName = data.project.projectName.replace(/[^a-z0-9]/gi, '_') || 'Untitled_Project';
  
  // Create CSV content
  const rows: string[][] = [];
  
  // Header
  rows.push(['Production Milestone Calculator - Export']);
  rows.push(['Project:', data.project.projectName]);
  rows.push(['Client:', data.project.clientName]);
  rows.push(['Truck Leave Date:', data.project.truckLeaveDate || 'Not Set']);
  rows.push(['Exported At:', new Date().toLocaleString()]);
  rows.push([]);
  
  // Calculation Summary
  rows.push(['CALCULATION SUMMARY']);
  rows.push(['Complexity Index:', data.calculation.complexityIndex.toString()]);
  rows.push(['Complexity Bucket:', data.calculation.bucket]);
  if (data.calculation.leadBucket) {
    rows.push(['Lead Bucket:', data.calculation.leadBucket]);
  }
  if (data.calculation.riskLevel) {
    rows.push(['Risk Level:', data.calculation.riskLevel]);
  }
  rows.push(['Information Completeness:', `${(data.calculation.informationCompleteness * 100).toFixed(0)}%`]);
  rows.push([]);
  
  // Tasks Schedule
  if (data.tasks && data.tasks.length > 0) {
    rows.push(['TASK SCHEDULE']);
    rows.push(['Task', 'Start Date', 'End Date', 'Success Factor']);
    data.tasks.forEach(task => {
      rows.push([task.name, task.startDate, task.endDate, task.successFactor]);
    });
    rows.push([]);
  }
  
  // Phase Durations (legacy, if available)
  if (data.phaseDurations) {
    rows.push(['PHASE DURATIONS (Days)']);
    rows.push(['Phase', 'Days']);
    rows.push(['Design', data.phaseDurations.designDays.toString()]);
    rows.push(['Client Review', data.phaseDurations.clientReviewDays.toString()]);
    rows.push(['Approval Buffer', data.phaseDurations.approvalBufferDays.toString()]);
    rows.push(['Procurement', data.phaseDurations.procurementDays.toString()]);
    rows.push(['Production', data.phaseDurations.productionDays.toString()]);
    rows.push(['QA & Pack', data.phaseDurations.qaAndPackDays.toString()]);
    rows.push([]);
  }
  
  // Milestones (legacy, if available)
  if (data.milestones) {
    rows.push(['MILESTONES (Legacy)']);
    rows.push(['Milestone', 'Date']);
    rows.push(['Design Start', data.milestones.designStart]);
    rows.push(['Client Review Start', data.milestones.clientReviewStart]);
    rows.push(['Approval Deadline', data.milestones.approvalDeadline]);
    rows.push(['Procurement Start', data.milestones.procurementStart]);
    rows.push(['Production Start', data.milestones.productionStart]);
    rows.push(['Production Complete', data.milestones.productionComplete]);
    rows.push(['Dispatch', data.milestones.dispatch]);
    rows.push(['Truck Leave', data.milestones.truckLeaveDate]);
    rows.push([]);
  }
  
  // Information Gates
  rows.push(['INFORMATION GATES']);
  rows.push(['Gate', 'Status']);
  rows.push(['Final Drawings', data.informationGates.finalDrawings ? 'Complete' : 'Pending']);
  rows.push(['Finishes Confirmed', data.informationGates.finishesConfirmed ? 'Complete' : 'Pending']);
  rows.push(['Branding Assets', data.informationGates.brandingAssets ? 'Complete' : 'Pending']);
  rows.push(['AV Inputs Confirmed', data.informationGates.avInputsConfirmed ? 'Complete' : 'Pending']);
  rows.push(['Engineering Signed Off', data.informationGates.engineeringSignedOff ? 'Complete' : 'Pending']);
  rows.push(['Client Scope Approved', data.informationGates.clientScopeApproved ? 'Complete' : 'Pending']);
  
  // Convert to CSV string
  const csvContent = rows
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName}_milestone_calculation.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToPDF(input: ProjectInput, result: CalculationResult): void {
  const data = prepareExportData(input, result);
  const projectName = data.project.projectName || 'Untitled Project';
  
  // Create a printable HTML document
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Production Milestone Calculator - ${projectName}</title>
  <style>
    @media print {
      @page { margin: 20mm; }
      body { margin: 0; }
    }
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      color: #333;
      line-height: 1.6;
    }
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 15px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 10px 0;
      color: #1e40af;
      font-size: 24px;
    }
    .header-info {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-top: 15px;
    }
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .section h2 {
      background: #f1f5f9;
      padding: 10px 15px;
      margin: 0 0 15px 0;
      border-left: 4px solid #2563eb;
      font-size: 18px;
      color: #1e40af;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
    }
    .card-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .card-value {
      font-size: 20px;
      font-weight: bold;
      color: #1e293b;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    table th, table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    table th {
      background: #f1f5f9;
      font-weight: bold;
      color: #475569;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 0.5px;
    }
    table tr:hover {
      background: #f8fafc;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .badge-low { background: #dcfce7; color: #166534; }
    .badge-medium { background: #dbeafe; color: #1e40af; }
    .badge-high { background: #fee2e2; color: #991b1b; }
    .badge-fast_track { background: #dcfce7; color: #166534; }
    .badge-standard { background: #dbeafe; color: #1e40af; }
    .badge-custom { background: #fef3c7; color: #92400e; }
    .badge-high_risk { background: #fee2e2; color: #991b1b; }
    .badge-ok { background: #dcfce7; color: #166534; }
    .badge-tight { background: #fef3c7; color: #92400e; }
    .badge-high { background: #fee2e2; color: #991b1b; }
    .progress-bar {
      width: 100%;
      height: 24px;
      background: #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      margin: 10px 0;
    }
    .progress-fill {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
    }
    .progress-green { background: #10b981; }
    .progress-yellow { background: #f59e0b; }
    .progress-red { background: #ef4444; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Production Milestone Calculator</h1>
    <div class="header-info">
      <div><strong>Project:</strong> ${data.project.projectName || 'N/A'}</div>
      <div><strong>Client:</strong> ${data.project.clientName || 'N/A'}</div>
      <div><strong>Truck Leave Date:</strong> ${data.project.truckLeaveDate || 'Not Set'}</div>
      <div><strong>Exported:</strong> ${new Date().toLocaleString()}</div>
    </div>
  </div>

  <div class="section">
    <h2>Calculation Summary</h2>
    <div class="grid-2">
      <div class="card">
        <div class="card-label">Complexity Index</div>
        <div class="card-value">${data.calculation.complexityIndex}</div>
      </div>
      <div class="card">
        <div class="card-label">Complexity Bucket</div>
        <div class="card-value">
          <span class="badge badge-${data.calculation.bucket}">${data.calculation.bucket}</span>
        </div>
      </div>
      ${data.calculation.leadBucket ? `
      <div class="card">
        <div class="card-label">Lead Bucket</div>
        <div class="card-value">
          <span class="badge badge-${data.calculation.leadBucket}">${data.calculation.leadBucket.replace(/_/g, ' ')}</span>
        </div>
      </div>
      ` : ''}
      ${data.calculation.riskLevel ? `
      <div class="card">
        <div class="card-label">Risk Level</div>
        <div class="card-value">
          <span class="badge badge-${data.calculation.riskLevel}">${data.calculation.riskLevel}</span>
        </div>
      </div>
      ` : ''}
      <div class="card">
        <div class="card-label">Information Completeness</div>
        <div class="card-value">${(data.calculation.informationCompleteness * 100).toFixed(0)}%</div>
        <div class="progress-bar">
          <div class="progress-fill progress-${
            data.calculation.informationCompleteness === 1
              ? 'green'
              : data.calculation.informationCompleteness >= 0.5
              ? 'yellow'
              : 'red'
          }" style="width: ${data.calculation.informationCompleteness * 100}%">
            ${(data.calculation.informationCompleteness * 100).toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  </div>

  ${data.tasks && data.tasks.length > 0 ? `
  <div class="section">
    <h2>Task Schedule</h2>
    <table>
      <thead>
        <tr>
          <th>Task</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Success Factor</th>
        </tr>
      </thead>
      <tbody>
        ${data.tasks.map(task => `
        <tr>
          <td>${task.name}</td>
          <td>${task.startDate}</td>
          <td>${task.endDate}</td>
          <td style="font-size: 11px; color: #64748b;">${task.successFactor}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${data.phaseDurations ? `
  <div class="section">
    <h2>Phase Durations (Legacy)</h2>
    <table>
      <thead>
        <tr>
          <th>Phase</th>
          <th>Duration (Days)</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Design</td><td>${data.phaseDurations.designDays}</td></tr>
        <tr><td>Client Review</td><td>${data.phaseDurations.clientReviewDays}</td></tr>
        <tr><td>Approval Buffer</td><td>${data.phaseDurations.approvalBufferDays}</td></tr>
        <tr><td>Procurement</td><td>${data.phaseDurations.procurementDays}</td></tr>
        <tr><td>Production</td><td>${data.phaseDurations.productionDays}</td></tr>
        <tr><td>QA & Pack</td><td>${data.phaseDurations.qaAndPackDays}</td></tr>
      </tbody>
    </table>
  </div>
  ` : ''}

  ${data.milestones ? `
  <div class="section">
    <h2>Milestones (Legacy)</h2>
    <table>
      <thead>
        <tr>
          <th>Milestone</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Design Start</td><td>${data.milestones.designStart}</td></tr>
        <tr><td>Client Review Start</td><td>${data.milestones.clientReviewStart}</td></tr>
        <tr><td>Approval Deadline</td><td>${data.milestones.approvalDeadline}</td></tr>
        <tr><td>Procurement Start</td><td>${data.milestones.procurementStart}</td></tr>
        <tr><td>Production Start</td><td>${data.milestones.productionStart}</td></tr>
        <tr><td>Production Complete</td><td>${data.milestones.productionComplete}</td></tr>
        <tr><td>Dispatch</td><td>${data.milestones.dispatch}</td></tr>
        <tr><td><strong>Truck Leave</strong></td><td><strong>${data.milestones.truckLeaveDate}</strong></td></tr>
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="section">
    <h2>Information Gates</h2>
    <table>
      <thead>
        <tr>
          <th>Gate</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Final Drawings</td><td>${data.informationGates.finalDrawings ? '✓ Complete' : '✗ Pending'}</td></tr>
        <tr><td>Finishes Confirmed</td><td>${data.informationGates.finishesConfirmed ? '✓ Complete' : '✗ Pending'}</td></tr>
        <tr><td>Branding Assets</td><td>${data.informationGates.brandingAssets ? '✓ Complete' : '✗ Pending'}</td></tr>
        <tr><td>AV Inputs Confirmed</td><td>${data.informationGates.avInputsConfirmed ? '✓ Complete' : '✗ Pending'}</td></tr>
        <tr><td>Engineering Signed Off</td><td>${data.informationGates.engineeringSignedOff ? '✓ Complete' : '✗ Pending'}</td></tr>
        <tr><td>Client Scope Approved</td><td>${data.informationGates.clientScopeApproved ? '✓ Complete' : '✗ Pending'}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>Generated by Production Milestone Calculator</p>
    <p>${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
  `;
  
  // Open in new window and trigger print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}

