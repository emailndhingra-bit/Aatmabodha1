import fetch from 'node-fetch';

async function testGeo() {
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=New%20York&count=5&language=en&format=json`);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
testGeo();
