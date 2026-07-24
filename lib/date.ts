export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildCalendarDays(currentMonth: Date) {
  const firstDay = startOfMonth(currentMonth);
  const startOffset = firstDay.getDay();

  const calendarStart = new Date(
    firstDay.getFullYear(),
    firstDay.getMonth(),
    1 - startOffset
  );

  return Array.from({ length: 42 }, (_, index) => {
    return new Date(
      calendarStart.getFullYear(),
      calendarStart.getMonth(),
      calendarStart.getDate() + index
    );
  });
}

export function formatKoreanDate(dateKey: string) {
  const [, month, day] = dateKey.split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}
