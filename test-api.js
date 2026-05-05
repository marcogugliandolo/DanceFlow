const http = require('http');

const data = JSON.stringify({
  id: "test-sess-1",
  activityId: "act-1",
  date: "2026-05-05",
  status: "held",
  justification: "",
  notes: "Test notes",
  attendeeIds: ["student-1", "student-2"]
});

const req = http.request({
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/sessions/test-sess-1',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  res.on('data', (d) => process.stdout.write(d));
  res.on('end', () => {
    console.log('\nNow fetching GET /api/sessions');
    http.get('http://127.0.0.1:3000/api/sessions', (getRes) => {
      let getBody = '';
      getRes.on('data', (c) => getBody += c);
      getRes.on('end', () => {
        let json = JSON.parse(getBody);
        let s = json.find(x => x.id === 'test-sess-1');
        console.log("Returned test session:", s);
      });
    });
  });
});

req.write(data);
req.end();
