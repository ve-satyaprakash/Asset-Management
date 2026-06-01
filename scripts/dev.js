const { spawn } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const isWindows = process.platform === "win32";
const subCommand = process.argv[2] || "dev";
const command = isWindows ? process.env.ComSpec || "cmd.exe" : "npm";
const commandArgs = isWindows ? ["/d", "/s", "/c", "npm", "run", subCommand] : ["run", subCommand];

const apps = [
  { name: "backend", cwd: path.join(root, "backend"), color: "\x1b[36m" },
  { name: "frontend", cwd: path.join(root, "frontend"), color: "\x1b[35m" }
];

const reset = "\x1b[0m";
const children = [];
let shuttingDown = false;

function prefixOutput(app, stream, data) {
  const lines = data.toString().split(/\r?\n/);

  for (const line of lines) {
    if (!line.trim()) continue;
    stream.write(`${app.color}[${app.name}]${reset} ${line}\n`);
  }
}

function stopAll(signal = "SIGTERM") {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

for (const app of apps) {
  const child = spawn(command, commandArgs, {
    cwd: app.cwd,
    env: process.env,
    shell: false,
    stdio: ["inherit", "pipe", "pipe"]
  });

  children.push(child);

  child.stdout.on("data", (data) => prefixOutput(app, process.stdout, data));
  child.stderr.on("data", (data) => prefixOutput(app, process.stderr, data));

  child.on("error", (error) => {
    console.error(`${app.color}[${app.name}]${reset} failed to start: ${error.message}`);
    stopAll();
    process.exitCode = 1;
  });

  child.on("exit", (code, signal) => {
    if (!shuttingDown) {
      const reason = signal ? `signal ${signal}` : `code ${code}`;
      console.error(`${app.color}[${app.name}]${reset} exited with ${reason}`);
      stopAll();
      process.exitCode = code || 1;
    }
  });
}

process.on("SIGINT", () => stopAll("SIGINT"));
process.on("SIGTERM", () => stopAll("SIGTERM"));
