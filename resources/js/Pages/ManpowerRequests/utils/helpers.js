// js/pages/ManpowerRequests/Create/utils/helpers.js
export function formatTimeToSeconds(timeString) {
  if (!timeString) return null;
  if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) return timeString;
  if (timeString.match(/^\d{2}:\d{2}$/)) return `${timeString}:00`;
  return null;
}