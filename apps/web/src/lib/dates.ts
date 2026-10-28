// Dates in the entity's time zone (Asia/Jakarta for personal entities), as YYYY-MM-DD strings.

export const TIME_ZONE = "Asia/Jakarta";

export function today(timeZone = TIME_ZONE, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function monthBounds(yearMonth: string): { year: number; month: number; from: string; to: string } {
  const [year = 0, month = 0] = yearMonth.split("-").map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const mm = String(month).padStart(2, "0");
  return { year, month, from: `${year}-${mm}-01`, to: `${year}-${mm}-${String(last).padStart(2, "0")}` };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export const monthLabel = (year: number, month: number) => `${MONTHS[month - 1] ?? month} ${year}`;
export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
