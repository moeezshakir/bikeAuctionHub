import { execSync } from "node:child_process";

const port = process.argv[2] || process.env.PORT || 3000;

function freePort(targetPort) {
  const pids = new Set();

  if (process.platform === "win32") {
    try {
      const output = execSync(`netstat -ano | findstr :${targetPort}`, { encoding: "utf8" });
      for (const line of output.split(/\r?\n/)) {
        if (!line.includes("LISTENING")) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts.at(-1);
        if (pid && /^\d+$/.test(pid) && pid !== "0") {
          pids.add(pid);
        }
      }
    } catch {
      console.log(`Port ${targetPort} is already free.`);
      return;
    }

    for (const pid of pids) {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "inherit" });
    }

    console.log(`Port ${targetPort} cleared.`);
    return;
  }

  try {
    const output = execSync(`lsof -ti tcp:${targetPort} -sTCP:LISTEN`, { encoding: "utf8" });
    for (const pid of output.split(/\s+/)) {
      if (pid) pids.add(pid);
    }
  } catch {
    console.log(`Port ${targetPort} is already free.`);
    return;
  }

  for (const pid of pids) {
    process.kill(Number(pid), "SIGTERM");
  }

  console.log(`Port ${targetPort} cleared.`);
}

freePort(port);
