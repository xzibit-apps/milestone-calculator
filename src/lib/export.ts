// lib/export.ts
// Export functions for Production Milestone Calculator v2
// Matches specification requirements from section 10

import type { ProjectInput, CalculationResult } from './types';

// Export data structure matching v2 specification
export interface ExportData {
  // Top-level fields (required by spec)
  projectName: string;
  clientName: string;
  truckLeaveDate: string | null;
  ci: number;
  bucket: string;
  infoCompleteness: number;
  
  // Tasks (internal view) - required by spec
  tasks: Array<{
    id: string;
    name: string;
    startDate: string | null; // ISO string or null
    endDate: string | null; // ISO string or null
    duration: number;
    successFactor: string;
  }>;
  
  // clientMilestones - mirrors tasks for v2 (required by spec)
  clientMilestones: Array<{
    id: string;
    name: string;
    startDate: string | null;
    endDate: string | null;
    duration: number;
    successFactor: string;
  }>;
  
  // ProjectInput object for convenience (optional per spec)
  projectInput?: ProjectInput;
  
  // Metadata
  exportedAt: string;
}

export function prepareExportData(
  input: ProjectInput,
  result: CalculationResult
): ExportData {
  // Format tasks for export
  const formatTask = (task: typeof result.tasks[0]) => ({
    id: task.id,
    name: task.name,
    startDate: task.startDate ? task.startDate.toISOString() : null,
    endDate: task.endDate ? task.endDate.toISOString() : null,
    duration: task.duration,
    successFactor: task.successFactor,
  });

  return {
    // Top-level fields (required by spec)
    projectName: input.projectName || 'Untitled Project',
    clientName: input.clientName || 'Unknown Client',
    truckLeaveDate: input.truckLeaveDate,
    ci: result.ci,
    bucket: result.bucket,
    infoCompleteness: result.infoCompleteness,
    
    // Tasks (internal view)
    tasks: result.tasks.map(formatTask),
    
    // clientMilestones (mirrors tasks for v2)
    clientMilestones: result.clientMilestones.map(formatTask),
    
    // ProjectInput for convenience
    projectInput: input,
    
    // Metadata
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
  const projectName = data.projectName.replace(/[^a-z0-9]/gi, '_') || 'Untitled_Project';
  a.download = `${projectName}_milestone_calculation.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCSV(input: ProjectInput, result: CalculationResult): void {
  const data = prepareExportData(input, result);
  const projectName = data.projectName.replace(/[^a-z0-9]/gi, '_') || 'Untitled_Project';
  
  // Create CSV content - flattened as per spec
  const rows: string[][] = [];
  
  // Header section
  rows.push(['Production Milestone Calculator - Export']);
  rows.push([]);
  
  // Top-level fields (flattened)
  rows.push(['Project Name', data.projectName]);
  rows.push(['Client Name', data.clientName]);
  rows.push(['Truck Leave Date', data.truckLeaveDate || 'Not Set']);
  rows.push(['Complexity Index (CI)', data.ci.toString()]);
  rows.push(['Complexity Bucket', data.bucket]);
  rows.push(['Information Completeness', `${(data.infoCompleteness * 100).toFixed(0)}%`]);
  rows.push(['Exported At', new Date(data.exportedAt).toLocaleString()]);
  rows.push([]);
  
  // Tasks Schedule (flattened as columns)
  if (data.tasks && data.tasks.length > 0) {
    rows.push(['TASK SCHEDULE']);
    rows.push(['Task ID', 'Task Name', 'Start Date', 'End Date', 'Duration (Days)', 'Success Factor']);
    data.tasks.forEach(task => {
      const startDate = task.startDate 
        ? new Date(task.startDate).toLocaleDateString() 
        : 'TBC';
      const endDate = task.endDate 
        ? new Date(task.endDate).toLocaleDateString() 
        : 'TBC';
      rows.push([
        task.id,
        task.name,
        startDate,
        endDate,
        task.duration.toString(),
        task.successFactor,
      ]);
    });
    rows.push([]);
  }
  
  // Client Milestones (same structure as tasks)
  if (data.clientMilestones && data.clientMilestones.length > 0) {
    rows.push(['CLIENT MILESTONES']);
    rows.push(['Milestone ID', 'Milestone Name', 'Start Date', 'End Date', 'Duration (Days)', 'Success Factor']);
    data.clientMilestones.forEach(milestone => {
      const startDate = milestone.startDate 
        ? new Date(milestone.startDate).toLocaleDateString() 
        : 'TBC';
      const endDate = milestone.endDate 
        ? new Date(milestone.endDate).toLocaleDateString() 
        : 'TBC';
      rows.push([
        milestone.id,
        milestone.name,
        startDate,
        endDate,
        milestone.duration.toString(),
        milestone.successFactor,
      ]);
    });
    rows.push([]);
  }
  
  // Project Input Details (flattened)
  if (data.projectInput) {
    rows.push(['PROJECT INPUT DETAILS']);
    rows.push(['Build Type', data.projectInput.buildType]);
    rows.push(['Stand Size', data.projectInput.standSize]);
    rows.push(['AV Complexity', data.projectInput.avComplexity]);
    rows.push(['Fabrication Intensity', data.projectInput.fabricationIntensity]);
    rows.push(['Brief Clarity', data.projectInput.briefClarity]);
    rows.push(['Engineering Required', data.projectInput.engineeringRequired ? 'Yes' : 'No']);
    rows.push(['Long Lead Items', data.projectInput.longLeadItems ? 'Yes' : 'No']);
    rows.push([]);
    
    // Information Gates
    rows.push(['INFORMATION GATES']);
    rows.push(['Gate', 'Status']);
    rows.push(['Final Drawings', data.projectInput.infoGates.finalDrawings ? 'Complete' : 'Pending']);
    rows.push(['Finishes Confirmed', data.projectInput.infoGates.finishesConfirmed ? 'Complete' : 'Pending']);
    rows.push(['Branding Assets', data.projectInput.infoGates.brandingAssets ? 'Complete' : 'Pending']);
    rows.push(['AV Inputs Confirmed', data.projectInput.infoGates.avInputsConfirmed ? 'Complete' : 'Pending']);
    rows.push(['Engineering Signed Off', data.projectInput.infoGates.engineeringSignedOff ? 'Complete' : 'Pending']);
    rows.push(['Client Scope Approved', data.projectInput.infoGates.clientScopeApproved ? 'Complete' : 'Pending']);
  }
  
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
  const projectName = data.projectName || 'Untitled Project';
  
  // Format date for display
  const formatDateDisplay = (dateStr: string | null) => {
    if (!dateStr) return 'TBC';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'TBC';
    }
  };
  
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
      <div><strong>Project:</strong> ${data.projectName || 'N/A'}</div>
      <div><strong>Client:</strong> ${data.clientName || 'N/A'}</div>
      <div><strong>Truck Leave Date:</strong> ${data.truckLeaveDate || 'Not Set'}</div>
      <div><strong>Exported:</strong> ${new Date(data.exportedAt).toLocaleString()}</div>
    </div>
  </div>

  <div class="section">
    <h2>Calculation Summary</h2>
    <div class="grid-2">
      <div class="card">
        <div class="card-label">Complexity Index</div>
        <div class="card-value">${data.ci}</div>
      </div>
      <div class="card">
        <div class="card-label">Complexity Bucket</div>
        <div class="card-value">
          <span class="badge badge-${data.bucket}">${data.bucket}</span>
        </div>
      </div>
      <div class="card">
        <div class="card-label">Information Completeness</div>
        <div class="card-value">${(data.infoCompleteness * 100).toFixed(0)}%</div>
        <div class="progress-bar">
          <div class="progress-fill progress-${
            data.infoCompleteness === 1
              ? 'green'
              : data.infoCompleteness >= 0.5
              ? 'yellow'
              : 'red'
          }" style="width: ${data.infoCompleteness * 100}%">
            ${(data.infoCompleteness * 100).toFixed(0)}%
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
          <th>Duration (Days)</th>
          <th>Success Factor</th>
        </tr>
      </thead>
      <tbody>
        ${data.tasks.map(task => `
        <tr>
          <td><strong>${task.name}</strong></td>
          <td>${formatDateDisplay(task.startDate)}</td>
          <td>${formatDateDisplay(task.endDate)}</td>
          <td>${task.duration}</td>
          <td style="font-size: 11px; color: #64748b;">${task.successFactor}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${data.clientMilestones && data.clientMilestones.length > 0 ? `
  <div class="section">
    <h2>Client Milestones</h2>
    <table>
      <thead>
        <tr>
          <th>Milestone</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Duration (Days)</th>
          <th>Success Factor</th>
        </tr>
      </thead>
      <tbody>
        ${data.clientMilestones.map(milestone => `
        <tr>
          <td><strong>${milestone.name}</strong></td>
          <td>${formatDateDisplay(milestone.startDate)}</td>
          <td>${formatDateDisplay(milestone.endDate)}</td>
          <td>${milestone.duration}</td>
          <td style="font-size: 11px; color: #64748b;">${milestone.successFactor}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${data.projectInput ? `
  <div class="section">
    <h2>Project Input Details</h2>
    <div class="grid-2">
      <div class="card">
        <div class="card-label">Build Type</div>
        <div class="card-value">${data.projectInput.buildType}</div>
      </div>
      <div class="card">
        <div class="card-label">Stand Size</div>
        <div class="card-value">${data.projectInput.standSize}</div>
      </div>
      <div class="card">
        <div class="card-label">AV Complexity</div>
        <div class="card-value">${data.projectInput.avComplexity}</div>
      </div>
      <div class="card">
        <div class="card-label">Fabrication Intensity</div>
        <div class="card-value">${data.projectInput.fabricationIntensity}</div>
      </div>
      <div class="card">
        <div class="card-label">Brief Clarity</div>
        <div class="card-value">${data.projectInput.briefClarity}</div>
      </div>
      <div class="card">
        <div class="card-label">Engineering Required</div>
        <div class="card-value">${data.projectInput.engineeringRequired ? 'Yes' : 'No'}</div>
      </div>
      <div class="card">
        <div class="card-label">Long Lead Items</div>
        <div class="card-value">${data.projectInput.longLeadItems ? 'Yes' : 'No'}</div>
      </div>
    </div>
  </div>

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
        <tr><td>Final Drawings</td><td>${data.projectInput.infoGates.finalDrawings ? '✓ Complete' : '✗ Pending'}</td></tr>
        <tr><td>Finishes Confirmed</td><td>${data.projectInput.infoGates.finishesConfirmed ? '✓ Complete' : '✗ Pending'}</td></tr>
        <tr><td>Branding Assets</td><td>${data.projectInput.infoGates.brandingAssets ? '✓ Complete' : '✗ Pending'}</td></tr>
        <tr><td>AV Inputs Confirmed</td><td>${data.projectInput.infoGates.avInputsConfirmed ? '✓ Complete' : '✗ Pending'}</td></tr>
        <tr><td>Engineering Signed Off</td><td>${data.projectInput.infoGates.engineeringSignedOff ? '✓ Complete' : '✗ Pending'}</td></tr>
        <tr><td>Client Scope Approved</td><td>${data.projectInput.infoGates.clientScopeApproved ? '✓ Complete' : '✗ Pending'}</td></tr>
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="footer">
    <p>Generated by Production Milestone Calculator v2</p>
    <p>${new Date(data.exportedAt).toLocaleString()}</p>
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
