import { execSync, spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const mode = process.argv[2] === "start" ? "start" : "dev";
const port = String(process.env.PORT || 3000);
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = path.join(projectRoot, "node_modules/next/dist/bin/next");
const setupDns = path.join(projectRoot, "setup-dns.js");

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
      return;
    }

    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      } catch {
        // Process may have already exited.
      }
    }
    return;
  }

  try {
    const output = execSync(`lsof -ti tcp:${targetPort} -sTCP:LISTEN`, { encoding: "utf8" });
    for (const pid of output.split(/\s+/)) {
      if (pid) pids.add(pid);
    }
  } catch {
    return;
  }

  for (const pid of pids) {
    try {
      process.kill(Number(pid), "SIGTERM");
    } catch {
      // Ignore stale PID.
    }
  }
}

function getPrimaryLanAddress() {
  for (const interfaces of Object.values(os.networkInterfaces())) {
    for (const net of interfaces || []) {
      const isIpv4 = net.family === "IPv4" || net.family === 4;
      if (isIpv4 && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}

const lanIp = getPrimaryLanAddress();
const localUrl = `http://localhost:${port}`;
const networkUrl = lanIp ? `http://${lanIp}:${port}` : localUrl;

function patchNextOutput(text) {
  return text
    .replace(/(\s+- Local:\s+)http:\/\/[^\r\n]+/g, `$1${localUrl}`)
    .replace(/(\s+- Network:\s+)http:\/\/[^\r\n]+/g, `$1${networkUrl}`)
    .replace(/http:\/\/0\.0\.0\.0:\d+/g, networkUrl);
}

if (mode === "dev") {
  freePort(port);
}

const args = ["-r", setupDns, nextBin, mode, "-H", "0.0.0.0", "-p", port];
const child = spawn(process.execPath, args, {
  cwd: projectRoot,
  stdio: ["inherit", "pipe", "inherit"],
  env: process.env,
});

child.stdout.on("data", (chunk) => {
  process.stdout.write(patchNextOutput(chunk.toString()));
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
