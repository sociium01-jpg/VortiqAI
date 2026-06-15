/**
 * Client-Side Mock Data Export Utility
 * Handles print formatting and exports data to virtual PDF, Excel, and Word files.
 */

export function handlePrint() {
  if (typeof window !== 'undefined') {
    window.print();
  }
}

export function handleExportPDF(title: string, data: any[]) {
  console.log(`[EXPORT] Generating PDF for "${title}"...`, data);
  alert(`PDF Generated successfully!\nSaved "${title}.pdf" (${data.length} records exported)`);
}

export function handleExportExcel(title: string, data: any[]) {
  console.log(`[EXPORT] Generating Excel sheet for "${title}"...`, data);
  
  if (data.length === 0) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(item => 
    Object.values(item).map(val => {
      const strVal = String(val).replace(/"/g, '""');
      return strVal.includes(',') ? `"${strVal}"` : strVal;
    }).join(',')
  ).join('\n');
  const csvContent = `${headers}\n${rows}`;
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, '_')}_export.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  alert(`Excel/CSV Export Completed!\nDownloaded "${title.toLowerCase().replace(/\s+/g, '_')}_export.csv"`);
}

export function handleExportWord(title: string, data: any[]) {
  console.log(`[EXPORT] Generating Word document for "${title}"...`, data);
  
  const textContent = `=========================================\n` +
                      `VORTIQ SYSTEM DATA EXPORT: ${title.toUpperCase()}\n` +
                      `Date: ${new Date().toLocaleDateString('en-IN')}\n` +
                      `=========================================\n\n` +
                      data.map((item, index) => 
                        `Record #${index + 1}\n` +
                        Object.entries(item).map(([key, val]) => `  ${key}: ${val}`).join('\n')
                      ).join('\n\n');
                      
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, '_')}_document.doc`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  alert(`Word Document Export Completed!\nDownloaded "${title.toLowerCase().replace(/\s+/g, '_')}_document.doc"`);
}
