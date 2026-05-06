async function run() {
  const s = {
    id: "test2",
    activityId: "act1",
    date: "2026-05-06",
    status: "held",
    duration: 1
  };
  const res = await fetch('http://localhost:3000/api/sessions/test2', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': 'connect.sid=' + (process.env.SID || '') 
    },
    body: JSON.stringify(s)
  });
  console.log(res.status, await res.text());
}
run();
