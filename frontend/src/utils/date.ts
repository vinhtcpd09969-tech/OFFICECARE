/**
 * Converts a date and time string (both in Vietnam local time) into a UTC ISO string.
 * Vietnam is in UTC+7 timezone.
 * 
 * @param dateStr Format: "YYYY-MM-DD"
 * @param timeStr Format: "HH:mm" or "HH:mm:ss"
 * @returns ISO string in UTC representing the local time in Vietnam
 */
export function convertToVietnamUtcIso(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split('-');
  const timeParts = timeStr.split(':');
  const hours = timeParts[0];
  const minutes = timeParts[1] || '00';
  
  // Construct a Date object using Date.UTC in Vietnam local time values
  const utcDate = new Date(Date.UTC(
    parseInt(year, 10),
    parseInt(month, 10) - 1,
    parseInt(day, 10),
    parseInt(hours, 10),
    parseInt(minutes, 10),
    0
  ));
  
  // Subtract 7 hours to get the actual UTC time (since Vietnam is UTC+7)
  return new Date(utcDate.getTime() - 7 * 60 * 60 * 1000).toISOString();
}
