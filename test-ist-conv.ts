function convertToISTForAPI(dob: string, tob: string, timezoneOffset: number) {
  // 1. Create a Date object representing the local birth time
  // We can't just parse "1990-01-01T12:00:00Z" because we need to apply the offset.
  // The offset is in hours.
  
  // Parse the date and time strings
  const [year, month, day] = dob.split('-').map(Number);
  const [hour, minute] = tob.split(':').map(Number);
  
  // Create a UTC date representing the exact moment in time
  // Local time = UTC time + offset
  // UTC time = Local time - offset
  
  // Let's create a UTC date assuming the input IS UTC, then subtract the offset
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  
  // Subtract the offset (in milliseconds) to get the true UTC time
  const offsetMs = timezoneOffset * 60 * 60 * 1000;
  const trueUtcTime = utcDate.getTime() - offsetMs;
  
  // Now add 5.5 hours (IST offset) to get the IST time
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istTime = trueUtcTime + istOffsetMs;
  
  // Create a new Date object for the IST time
  const istDate = new Date(istTime);
  
  // Format back to YYYY-MM-DD and HH:mm
  const istDob = istDate.toISOString().split('T')[0];
  const istTob = istDate.toISOString().split('T')[1].substring(0, 5);
  
  return { date_of_birth: istDob, time_of_birth: istTob };
}

console.log(convertToISTForAPI("1990-01-01", "12:00", -5)); // Expected: 1990-01-01 22:30
console.log(convertToISTForAPI("1990-01-01", "20:00", -5)); // Expected: 1990-01-02 06:30
console.log(convertToISTForAPI("1990-01-01", "12:00", 5.5)); // Expected: 1990-01-01 12:00
