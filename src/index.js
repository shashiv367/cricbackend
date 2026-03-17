// NOTE:
// Some deployments start the backend via package.json "main" (src/index.js).
// The real API (including /api/umpire/*) is defined in src/server.js.
// To avoid route mismatches (404 on toss, etc), always start the same server.
require('./server');
