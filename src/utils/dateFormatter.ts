export function formatDateToDDMMMMYYYY(dateStr?: string | Date | null): string {
  if (!dateStr) return "";

  // If already formatted or special string
  if (typeof dateStr === "string" && /^\d{2}\/[A-Za-z]+\/\d{4}$/.test(dateStr.trim())) {
    return dateStr.trim();
  }

  // Parse YYYY-MM-DD cleanly
  if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
    const parts = dateStr.trim().split("-");
    const yyyy = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const dd = parts[2].padStart(2, "0");
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${dd}/${monthNames[monthIdx]}/${yyyy}`;
    }
  }

  const dateObj = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(dateObj.getTime())) {
    return String(dateStr);
  }

  const day = dateObj.getDate().toString().padStart(2, "0");
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthName = monthNames[dateObj.getMonth()] || "";
  const year = dateObj.getFullYear();

  return `${day}/${monthName}/${year}`;
}
