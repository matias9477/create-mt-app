/**
 * Post-scaffold pipeline: dependency installation (latest versions resolved
 * at scaffold time — nothing is pinned in the template), drizzle migration
 * generation, verification, and git init.
 *
 * Version policy: expo/react-native/native modules go through `npx expo install`
 * so the SDK's compatibility map picks versions (hand-pinning native modules is
 * how you get broken native builds). Pure-JS libraries install at @latest.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { run } from "./run.js";

/** Resolved by `npx expo install` against the installed SDK. */
const EXPO_RUNTIME_PACKAGES = [
  "expo-router",
  "expo-constants",
  "expo-crypto",
  "expo-font",
  "expo-haptics",
  "expo-image",
  "expo-linking",
  "expo-localization",
  "expo-splash-screen",
  "expo-sqlite",
  "expo-status-bar",
  "expo-store-review",
  "expo-system-ui",
  "expo-web-browser",
  "expo-widgets",
  "expo-dev-client",
  "@expo/ui",
  "@expo/vector-icons",
  "@react-native-async-storage/async-storage",
  "react",
  "react-dom",
  "react-native",
  "react-native-web",
  "react-native-gesture-handler",
  "react-native-reanimated",
  "react-native-worklets",
  "react-native-safe-area-context",
  "react-native-screens",
];

const EXPO_DEV_PACKAGES = ["jest", "jest-expo", "@types/react", "typescript", "babel-preset-expo"];

/** Pure-JS (or RevenueCat, which tracks its own RN compatibility) — always latest. */
const NPM_LATEST_DEPS = [
  "drizzle-orm",
  "zod",
  "zustand",
  "i18next",
  "react-i18next",
  "react-hook-form",
  "@hookform/resolvers",
  "nativewind",
  "date-fns",
  "react-native-purchases",
  "react-native-purchases-ui",
];

const NPM_LATEST_DEV = [
  "@biomejs/biome",
  "@types/jest",
  "drizzle-kit",
  "tailwindcss@^3",
  "babel-plugin-inline-import",
  "@matias9477/expo-release@github:matias9477/expo-release#v1.0.0",
];

export async function installDependencies(cwd: string): Promise<void> {
  // 1. Expo first — it anchors the SDK version everything else resolves against.
  await run("npm", ["install", "expo@latest"], { cwd });
  // 2. SDK-managed packages at SDK-compatible versions. `expo install` saves
  // everything into dependencies; dev tools are moved to devDependencies after.
  await run("npx", ["expo", "install", ...EXPO_RUNTIME_PACKAGES], { cwd });
  await run("npx", ["expo", "install", ...EXPO_DEV_PACKAGES], { cwd });
  await moveToDevDependencies(cwd, EXPO_DEV_PACKAGES);
  // 3. Everything else at latest.
  await run("npm", ["install", ...NPM_LATEST_DEPS.map((p) => `${p}@latest`)], { cwd });
  await run(
    "npm",
    ["install", "--save-dev", ...NPM_LATEST_DEV.map((p) => (p.includes("@", 1) ? p : `${p}@latest`))],
    { cwd },
  );
}

/** expo install has no --save-dev; relocate dev tooling entries afterwards. */
async function moveToDevDependencies(cwd: string, packages: string[]): Promise<void> {
  const pkgPath = path.join(cwd, "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  pkg.dependencies ??= {};
  pkg.devDependencies ??= {};
  for (const name of packages) {
    const version = pkg.dependencies[name];
    if (version !== undefined) {
      pkg.devDependencies[name] = version;
      delete pkg.dependencies[name];
    }
  }
  pkg.devDependencies = Object.fromEntries(
    Object.entries(pkg.devDependencies).sort(([a], [b]) => a.localeCompare(b)),
  );
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

/**
 * Pin AGENTS.md to the SDK that actually got installed — a knowledge-cutoff
 * guard so agents read the right versioned Expo docs before writing code.
 * The template ships a "latest" fallback for --skip-install runs.
 */
export async function writeAgentsFile(cwd: string): Promise<void> {
  try {
    const expoPkg = JSON.parse(
      await readFile(path.join(cwd, "node_modules/expo/package.json"), "utf8"),
    ) as { version?: string };
    const major = expoPkg.version?.split(".")[0];
    if (!major) return;
    const content = `# Expo HAS CHANGED\n\nRead the exact versioned docs at https://docs.expo.dev/versions/v${major}.0.0/ before writing any code.\n`;
    await writeFile(path.join(cwd, "AGENTS.md"), content);
  } catch {
    // Keep the template's "latest" fallback.
  }
}

export async function generateMigrations(cwd: string): Promise<void> {
  await run("npx", ["drizzle-kit", "generate", "--name", "init"], { cwd });
}

export interface VerifyResult {
  typecheck: boolean;
  tests: boolean;
  lint: boolean;
}

export async function verify(cwd: string): Promise<VerifyResult> {
  const typecheck = (await run("npx", ["tsc", "--noEmit"], { cwd, allowFailure: true })) === 0;
  const tests =
    (await run("npx", ["jest", "--passWithNoTests"], {
      cwd,
      allowFailure: true,
      env: { CI: "1" },
    })) === 0;
  // Biome formats what we generated so templates don't need to be byte-perfect.
  await run("npx", ["biome", "check", "--write", "."], { cwd, allowFailure: true });
  const lint = (await run("npx", ["biome", "check", "."], { cwd, allowFailure: true })) === 0;
  return { typecheck, tests, lint };
}

export async function initGit(cwd: string, appName: string): Promise<boolean> {
  try {
    await run("git", ["init"], { cwd });
    await run("git", ["add", "-A"], { cwd });
    await run(
      "git",
      ["commit", "-m", `feat: scaffold ${appName} with create-mt-app`, "--no-verify"],
      { cwd },
    );
    return true;
  } catch {
    return false;
  }
}
