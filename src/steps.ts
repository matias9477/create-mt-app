/**
 * Post-scaffold pipeline: dependency installation, drizzle migration
 * generation, formatting, verification, and git init.
 *
 * Version policy: expo/react-native/native modules go through `npx expo install`
 * so the SDK's compatibility map picks versions (hand-pinning native modules is
 * how you get broken native builds). Pure-JS libraries install at the newest
 * release of the major the template's code is written against — a new major
 * is a deliberate template change, never something a fresh scaffold picks up.
 *
 * The pipeline is a flat list of shell commands so that, when one fails, the
 * remaining ones can be printed for the user to finish by hand.
 */
import { readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { run } from "./run.js";

/** Resolved by `npx expo install` against the installed SDK. */
const EXPO_RUNTIME_PACKAGES = [
  "expo-router",
  "expo-constants",
  "expo-crypto",
  "expo-font",
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
  "react-native-google-mobile-ads",
  "react-native-reanimated",
  "react-native-worklets",
  "react-native-safe-area-context",
  "react-native-screens",
];

// @types/jest must match the jest major jest-expo pins — @latest outruns it.
const EXPO_DEV_PACKAGES = [
  "jest",
  "jest-expo",
  "@types/jest",
  "@types/react",
  "typescript",
  "babel-preset-expo",
];

/**
 * Pure-JS libraries, pinned to the major the template is written against
 * (bump deliberately, after checking the template still compiles), plus native
 * libs outside the Expo SDK map that track RN compatibility themselves
 * (RevenueCat, Pulsar) — those stay at latest so new RN versions keep working.
 */
const NPM_DEPS = [
  // 1.0 changes the migrations layout the expo migrator + drizzle-kit agree on.
  "drizzle-orm@<1",
  "zod@^4",
  "zustand@^5",
  "i18next@^26",
  "react-i18next@^17",
  "react-hook-form@^7",
  // 6.0.0 ships an inconsistent optional peer tree (effect@^4 directly, but
  // @typeschema/effect needs effect@^3) that makes npm fail with ERESOLVE.
  // 5.9.2 supports zod 4 + RHF ^7.55. Unpin once a 6.x install resolves cleanly
  // (`npm install @hookform/resolvers@latest` in a scaffolded app).
  "@hookform/resolvers@^5.9.2",
  // The template is NativeWind v4 (babel preset + tailwind v3 config); v5 is a migration.
  "nativewind@^4",
  "date-fns@^4",
  "react-native-purchases@latest",
  "react-native-purchases-ui@latest",
  // Haptics (Software Mansion). Replaces expo-haptics: named rich presets,
  // preloading, a global enable switch, and worklet-callable from Reanimated.
  "react-native-pulsar@latest",
];

const NPM_DEV_DEPS = [
  // Must match drizzle-orm's major (`db:generate`).
  "drizzle-kit@<1",
  // NativeWind v4 needs tailwind v3 as a direct dependency.
  "tailwindcss@^3.4.17",
  // babel.config.js: lets drizzle's `.sql` migrations be imported as strings.
  "babel-plugin-inline-import@^3",
  // `npm run release`.
  "@matias9477/expo-release@github:matias9477/expo-release#v1.4.0",
];

export interface Step {
  label: string;
  command: string;
  args: string[];
  /** Failure is reported but doesn't stop the pipeline. */
  allowFailure?: boolean;
  /** JS fixup run after the command; `hint` describes it for manual recovery. */
  after?: { run: (cwd: string) => Promise<void>; hint: string };
}

/**
 * Biome is pinned exactly to the version in the template's biome.json
 * `$schema`, so the two can't drift: bump the schema URL and the next
 * scaffold installs the matching CLI.
 */
function biomeVersion(cwd: string): string {
  const config = JSON.parse(readFileSync(path.join(cwd, "biome.json"), "utf8")) as {
    $schema?: string;
  };
  const version = config.$schema?.match(/schemas\/(\d+\.\d+\.\d+)\//)?.[1];
  if (!version) throw new Error("template biome.json $schema has no biome version");
  return version;
}

export function setupSteps(cwd: string): Step[] {
  return [
    // Expo first — it anchors the SDK version everything else resolves against.
    {
      label: "Install Expo (latest SDK)",
      command: "npm",
      args: ["install", "expo@latest"],
    },
    // SDK-managed packages at SDK-compatible versions.
    {
      label: "Install SDK-managed packages",
      command: "npx",
      args: ["expo", "install", ...EXPO_RUNTIME_PACKAGES],
    },
    {
      label: "Install SDK-managed dev tooling",
      command: "npx",
      args: ["expo", "install", ...EXPO_DEV_PACKAGES],
      // expo install saves into dependencies (it drops `-- --save-dev` with npm).
      after: {
        run: (dir) => moveToDevDependencies(dir, EXPO_DEV_PACKAGES),
        hint: `then move ${EXPO_DEV_PACKAGES.join(", ")} to devDependencies in package.json`,
      },
    },
    { label: "Install libraries", command: "npm", args: ["install", ...NPM_DEPS] },
    {
      label: "Install dev tooling",
      command: "npm",
      args: ["install", "--save-dev", ...NPM_DEV_DEPS],
    },
    {
      label: "Install Biome",
      command: "npm",
      args: ["install", "--save-dev", "--save-exact", `@biomejs/biome@${biomeVersion(cwd)}`],
    },
    // app/_layout.tsx imports drizzle/migrations — the app doesn't bundle without it.
    {
      label: "Generate initial Drizzle migration",
      command: "npx",
      args: ["drizzle-kit", "generate", "--name", "init"],
    },
    // Token substitution (feature name, app name) changes import order and
    // line lengths, so the template can't be byte-perfect for every config.
    {
      label: "Format generated code (biome)",
      command: "npx",
      args: ["biome", "check", "--write", "."],
      allowFailure: true,
    },
  ];
}

/** Copy-pasteable shell rendering of a step (quotes `<1`, `^4`, `#v1`...). */
export function formatCommand(step: Step): string {
  const quote = (arg: string) => (/^[\w@./:=-]+$/.test(arg) ? arg : `'${arg}'`);
  const command = [step.command, ...step.args].map(quote).join(" ");
  return step.after ? `${command}\n  # ${step.after.hint}` : command;
}

/**
 * Runs the steps in order. Returns the index of the first failed step
 * (allowFailure steps never fail), or undefined when everything ran.
 */
export async function runSteps(
  cwd: string,
  steps: Step[],
  onStep: (step: Step) => void,
): Promise<number | undefined> {
  for (const [index, step] of steps.entries()) {
    onStep(step);
    try {
      await run(step.command, step.args, { cwd, allowFailure: step.allowFailure ?? false });
      await step.after?.run(cwd);
    } catch {
      return index;
    }
  }
  return undefined;
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
