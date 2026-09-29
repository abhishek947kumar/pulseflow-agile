// Export & Reporting Engine for PulseFlow

export function exportBoardToCSV({ board, tasks, columns, users }) {
  if (!tasks || tasks.length === 0) return;

  const getColName = (id) => columns.find(c => c.id === id)?.title || id;
  const getUserName = (id) => users.find(u => u.id === id)?.name || 'Unassigned';

  const headers = [
    'Task ID',
    'Title',
    'Stage / Column',
    'Priority',
    'Assignee',
    'Estimated (Hours)',
    'Logged (Hours)',
    'Due Date',
    'Completed Subtasks',
    'Total Subtasks',
    'Tags'
  ];

  const escapeCSV = (str) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = tasks.map(t => {
    const totalSub = t.subtasks?.length || 0;
    const completedSub = t.subtasks?.filter(s => s.completed).length || 0;
    const tags = (t.tags || []).map(x => x.name).join('; ');
    const loggedHours = +( (t.timeSpentSeconds || 0) / 3600 ).toFixed(2);

    return [
      escapeCSV(t.id),
      escapeCSV(t.title),
      escapeCSV(getColName(t.columnId)),
      escapeCSV(t.priority || 'medium'),
      escapeCSV(getUserName(t.assigneeId)),
      escapeCSV(t.estimatedHours || 0),
      escapeCSV(loggedHours),
      escapeCSV(t.dueDate || 'N/A'),
      escapeCSV(completedSub),
      escapeCSV(totalSub),
      escapeCSV(tags)
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const filename = `${(board?.key || 'pulseflow').toLowerCase()}-sprint-export-${new Date().toISOString().split('T')[0]}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generatePrintableReport({ board, tasks, columns, users }) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to view the printable executive report.');
    return;
  }

  const getColName = (id) => columns.find(c => c.id === id)?.title || id;
  const getUserName = (id) => users.find(u => u.id === id)?.name || 'Unassigned';

  const totalTasks = tasks.length;
  const completed = tasks.filter(t => t.columnId.includes('completed')).length;
  const rate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
  const totalLogged = +(tasks.reduce((sum, t) => sum + (t.timeSpentSeconds || 0), 0) / 3600).toFixed(1);
  const totalEst = +(tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)).toFixed(1);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>PulseFlow Executive Sprint Report — ${board?.title || 'Active Project'}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0f172a; max-width: 900px; margin: 0 auto; }
          h1 { margin-bottom: 4px; font-size: 24px; }
          .header-meta { color: #64748b; font-size: 13px; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
          .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
          .kpi-box { padding: 14px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; }
          .kpi-box .val { font-size: 22px; font-weight: bold; color: #1e293b; }
          .kpi-box .lbl { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
          th { text-align: left; background: #f1f5f9; padding: 10px; border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
          .urgent { background: #ffe4e6; color: #e11d48; }
          .high { background: #fef3c7; color: #d97706; }
          .medium { background: #ede9fe; color: #7c3aed; }
          .low { background: #f1f5f9; color: #64748b; }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 16px;">
          <button onclick="window.print()" style="padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
            Print / Save as PDF
          </button>
        </div>

        <h1>${board?.title || 'PulseFlow Agile Project'}</h1>
        <div class="header-meta">
          Executive Milestone Summary &bull; Generated on ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}
        </div>

        <div class="kpi-row">
          <div class="kpi-box">
            <div class="lbl">Sprint Completion Rate</div>
            <div class="val">${rate}%</div>
          </div>
          <div class="kpi-box">
            <div class="lbl">Total Tasks</div>
            <div class="val">${totalTasks}</div>
          </div>
          <div class="kpi-box">
            <div class="lbl">Hours Logged</div>
            <div class="val">${totalLogged}h</div>
          </div>
          <div class="kpi-box">
            <div class="lbl">Estimated Target</div>
            <div class="val">${totalEst}h</div>
          </div>
        </div>

        <h3 style="margin-bottom: 8px; font-size: 16px;">Deliverables Registry</h3>
        <table>
          <thead>
            <tr>
              <th>Priority</th>
              <th>Task</th>
              <th>Stage</th>
              <th>Assignee</th>
              <th>Logged / Est</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(t => `
              <tr>
                <td><span class="badge ${t.priority || 'medium'}">${t.priority || 'medium'}</span></td>
                <td><strong>${t.title}</strong></td>
                <td>${getColName(t.columnId)}</td>
                <td>${getUserName(t.assigneeId)}</td>
                <td>${((t.timeSpentSeconds || 0)/3600).toFixed(1)}h / ${t.estimatedHours || 0}h</td>
                <td>${t.dueDate || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
