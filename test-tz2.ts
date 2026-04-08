function getOffsetInHours(dateString, timeString, timeZone) {
  const localDate = new Date(`${dateString}T${timeString}:00Z`); // Treat as UTC initially
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
  });
  
  const parts = formatter.formatToParts(localDate);
  const tzNamePart = parts.find(p => p.type === 'timeZoneName');
  
  if (tzNamePart && tzNamePart.value) {
    let offsetStr = tzNamePart.value.replace('GMT', '');
    if (!offsetStr) return 0; // "GMT"
    
    const sign = offsetStr.startsWith('-') ? -1 : 1;
    offsetStr = offsetStr.replace(/[+-]/, '');
    const [hours, minutes] = offsetStr.split(':').map(Number);
    return sign * (hours + (minutes || 0) / 60);
  }
  return 0;
}

console.log(getOffsetInHours('2023-07-01', '12:00', 'Europe/London')); // BST: +1
console.log(getOffsetInHours('2023-01-01', '12:00', 'Europe/London')); // GMT: 0
