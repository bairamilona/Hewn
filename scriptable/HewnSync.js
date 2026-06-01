// HewnSync — run via URL scheme from the Hewn app
// scriptable:///run/HewnSync?p=65&pt=120&m=20&mt=30&date=2024-01-15

const q = args.queryParameters;
const data = {
  p:       parseFloat(q.p  || 0),
  pTarget: parseFloat(q.pt || 120),
  m:       parseFloat(q.m  || 0),
  mTarget: parseFloat(q.mt || 30),
  date:    q.date || new Date().toISOString().split("T")[0],
};
Keychain.set("hewn_data", JSON.stringify(data));
Safari.open("https://ewn-mauve.vercel.app");
Script.complete();
