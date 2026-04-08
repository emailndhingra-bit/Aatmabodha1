const fetch = require('node-fetch');

async function test() {
  const res = await fetch('https://flask-creator-nitingauri2008.replit.app/api/chart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date_of_birth: "1990-01-01",
      time_of_birth: "12:00",
      latitude: 28.6139,
      longitude: 77.2090,
      timezone: 5.5
    })
  });
  const data = await res.json();
  console.log(Object.keys(data));
  const fs = require('fs');
  fs.writeFileSync('test.json', JSON.stringify(data, null, 2));
}

test();
