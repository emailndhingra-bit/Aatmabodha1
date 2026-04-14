/** Same IST conversion as admin quick-chart for Replit engine. */
export function chartPayloadFromProfileFields(input: {
  dateOfBirth: string;
  timeOfBirth: string;
  latitude: number;
  longitude: number;
  timezone?: number | string | null;
}): {
  date_of_birth: string;
  time_of_birth: string;
  latitude: number;
  longitude: number;
  timezone: number;
} {
  const tzRaw =
    input.timezone != null && String(input.timezone) !== ''
      ? parseFloat(String(input.timezone))
      : Number.NaN;
  const tzVal = Number.isFinite(tzRaw) ? tzRaw : 5.5;
  const dobVal = input.dateOfBirth;
  const tobVal = input.timeOfBirth;
  const [year, month, day] = dobVal.split('-').map(Number);
  const [hour, minute] = tobVal.split(':').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offsetMs = tzVal * 60 * 60 * 1000;
  const trueUtcTime = utcDate.getTime() - offsetMs;
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istTime = trueUtcTime + istOffsetMs;
  const istDate = new Date(istTime);
  const istDob = istDate.toISOString().split('T')[0];
  const istTob = istDate.toISOString().split('T')[1].substring(0, 5);
  return {
    date_of_birth: istDob,
    time_of_birth: istTob,
    latitude: input.latitude,
    longitude: input.longitude,
    timezone: tzVal,
  };
}
