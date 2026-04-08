function testTZ() {
  const dob = '1990-01-01';
  const tob = '12:00';
  const timezoneName = 'America/New_York';
  
  const localDate = new Date(`${dob}T${tob}:00Z`); // Treat as UTC initially
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezoneName,
    timeZoneName: 'shortOffset',
  });
  
  const parts = formatter.formatToParts(localDate);
  const tzNamePart = parts.find(p => p.type === 'timeZoneName');
  
  if (tzNamePart && tzNamePart.value) {
    let offsetStr = tzNamePart.value.replace('GMT', '');
    if (!offsetStr) {
      console.log(0);
    } else {
      const sign = offsetStr.startsWith('-') ? -1 : 1;
      offsetStr = offsetStr.replace(/[+-]/, '');
      const [hours, minutes] = offsetStr.split(':').map(Number);
      console.log(sign * (hours + (minutes || 0) / 60));
    }
  }
}
testTZ();
