export const filterTableById = (tableId, filterText) => {
  const table = document.getElementById(tableId);
  if (!table) return;

  const tbody = table.getElementsByTagName('tbody')[0];
  if (!tbody) return;

  const rows = Array.from(tbody.getElementsByTagName('tr'));
  const filterLower = filterText.toLowerCase().trim();

  // Remove existing 'No record found' row if present
  const existingNoRecordRow = tbody.querySelector('.no-record-row');
  if (existingNoRecordRow) {
    existingNoRecordRow.remove();
  }

  let visibleCount = 0;

  // Search through standard rows
  rows.forEach((row) => {
    // Ignore no-record row if encountered
    if (row.classList.contains('no-record-row')) return;

    const rowText = row.innerText.toLowerCase();
    if (rowText.includes(filterLower)) {
      row.style.display = '';
      visibleCount++;
    } else {
      row.style.display = 'none';
    }
  });

  // If no rows are visible, add No Record Found row dynamically
  if (visibleCount === 0 && filterLower !== '') {
    // Calculate total columns for Colspan
    const totalCols = table.querySelectorAll('thead th').length || 5;

    const noRecordRow = document.createElement('tr');
    noRecordRow.className = 'no-record-row';
    noRecordRow.innerHTML = `
      <td colspan="${totalCols}" style="text-align: center; padding: 20px; color: #ef4444; font-weight: 600; background-color: #fef2f2;">
        No Record Found
      </td>
    `;
    tbody.appendChild(noRecordRow);
  }
};