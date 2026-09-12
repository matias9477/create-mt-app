/**
 * Thin child-process helper. Streams output to the terminal so the user
 * sees npm/expo progress live; throws on non-zero exit unless `allowFailure`.
 */
import { spawn } from "node:child_process";

export interface RunOptions {
  cwd: string;
  allowFailure?: boolean;
  env?: NodeJS.ProcessEnv;
}

export function run(command: string, args: string[], options: RunOptions): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: "inherit",
      env: { ...process.env, ...options.env },
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0 || options.allowFailure) resolve(code ?? 0);
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}
