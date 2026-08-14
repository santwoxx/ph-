import type { StoreSettings } from "./types";

export function checkIsStoreOpen(settings: StoreSettings): boolean {
  if (!settings.isAutoOpen || !settings.schedule) {
    return settings.isOpen;
  }

  // Obter hora atual no fuso horário de São Paulo (Brasília)
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short' // Sun, Mon, Tue, etc
  };

  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(now);
  
  let currentHourStr = "";
  let currentMinuteStr = "";
  let weekdayStr = "";

  for (const part of parts) {
    if (part.type === 'hour') currentHourStr = part.value;
    if (part.type === 'minute') currentMinuteStr = part.value;
    if (part.type === 'weekday') weekdayStr = part.value;
  }

  // '24' replaces '00' sometimes in intl formatter depending on node version, handle it:
  if (currentHourStr === '24') currentHourStr = '00';

  const currentTotalMinutes = parseInt(currentHourStr, 10) * 60 + parseInt(currentMinuteStr, 10);
  
  const daysMap: Record<string, string> = {
    "Sun": "0",
    "Mon": "1",
    "Tue": "2",
    "Wed": "3",
    "Thu": "4",
    "Fri": "5",
    "Sat": "6"
  };

  const dayIndex = daysMap[weekdayStr];
  if (!dayIndex) return false;

  const todaySchedule = settings.schedule[dayIndex];

  if (!todaySchedule || !todaySchedule.active) {
    return false;
  }

  const [startHour, startMin] = todaySchedule.start.split(":").map(Number);
  const [endHour, endMin] = todaySchedule.end.split(":").map(Number);

  const startTotalMinutes = startHour * 60 + startMin;
  const endTotalMinutes = endHour * 60 + endMin;

  if (startTotalMinutes <= endTotalMinutes) {
    return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes;
  } else {
    // Horário cruza a meia-noite (ex: 18:00 às 02:00)
    return currentTotalMinutes >= startTotalMinutes || currentTotalMinutes <= endTotalMinutes;
  }
}
