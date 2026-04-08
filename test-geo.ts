async function test() {
  const res = await fetch('https://geocoding-api.open-meteo.com/v1/search?name=Delhi&count=1&language=en&format=json');
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
