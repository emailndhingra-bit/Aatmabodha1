const https = require('https');

https.get('https://geocoding-api.open-meteo.com/v1/search?name=Delhi&count=1&language=en&format=json', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
});
