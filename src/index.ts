#!/usr/bin/env node
/**
 * create-mt-app — scaffold an Expo app with Matias's standard stack.
 *
 * Usage:
 *   npm create mt-app                 # fully interactive
 *   npm create mt-app -- "My App"     # name from argv, prompts for the rest
 *   npm create mt-app -- "My App" --yes --dir ~/Projects/my-app
 *
 * Flags:
 *   --yes            accept all defaults (still requires a name)
 *   --dir <path>     target directory (default ~/Projects/<slug>)
 *   --feature <name> primary feature module name (default "items")
 *   --accent <hex>   accent color (default #fcba03)
 *   --skip-install   scaffold files only (no npm/expo install, migrations, checks)
 *   --skip-git       don't git init / commit
 */
import { existsSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as p from "@clack/prompts";
import pc from "picocolors";
import {
  DEFAULTS,
  type ProjectConfig,
  buildTokens,
  normalizeFeature,
  slugify,
  toPascal,
  validateAccent,
  validateBundleId,
  validateFeature,
} from "./config.js";
import {
  generateMigrations,
  initGit,
  installDependencies,
  verify,
  writeAgentsFile,
} from "./steps.js";
import { scaffoldTemplate } from "./template.js";

interface CliFlags {
  yes: boolean;
  skipInstall: boolean;
  skipGit: boolean;
  dir?: string;
  feature?: string;
  accent?: string;
  name?: string;
}

function parseArgs(argv: string[]): CliFlags {
  const flags: CliFlags = { yes: false, skipInstall: false, skipGit: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined) continue;
    switch (arg) {
      case "--yes":
      case "-y":
        flags.yes = true;
        break;
      case "--skip-install":
        flags.skipInstall = true;
        break;
      case "--skip-git":
        flags.skipGit = true;
        break;
      case "--dir": {
        const value = argv[++i];
        if (value !== undefined) flags.dir = value;
        break;
      }
      case "--feature": {
        const value = argv[++i];
        if (value !== undefined) flags.feature = value;
        break;
      }
      case "--accent": {
        const value = argv[++i];
        if (value !== undefined) flags.accent = value;
        break;
      }
      default:
        if (!arg.startsWith("-") && !flags.name) flags.name = arg;
    }
  }
  return flags;
}

function dirIsUsable(dir: string): string | undefined {
  if (!existsSync(dir)) return undefined;
  const entries = readdirSync(dir).filter((e: string) => e !== ".DS_Store");
  return entries.length === 0 ? undefined : `${dir} already exists and is not empty`;
}

async function promptText(options: {
  message: string;
  initialValue?: string;
  useDefault: boolean;
  validate?: (value: string) => string | undefined;
}): Promise<string> {
  if (options.useDefault && options.initialValue !== undefined) {
    const error = options.validate?.(options.initialValue);
    if (error) {
      p.cancel(error);
      process.exit(1);
    }
    return options.initialValue;
  }
  const result = await p.text({
    message: options.message,
    ...(options.initialValue !== undefined ? { initialValue: options.initialValue } : {}),
    validate: (value) => options.validate?.(value ?? ""),
  });
  if (p.isCancel(result)) {
    p.cancel("Cancelled.");
    process.exit(1);
  }
  return result;
}

async function collectConfig(flags: CliFlags): Promise<ProjectConfig> {
  const appName =
    flags.name ??
    (await promptText({
      message: "App name",
      useDefault: false,
      validate: (v) => (v.trim() ? undefined : "App name is required"),
    }));

  const slug = slugify(
    await promptText({ message: "Slug", initialValue: slugify(appName), useDefault: flags.yes }),
  );

  const bundleId = await promptText({
    message: "iOS bundle id / Android package",
    initialValue: `${DEFAULTS.bundlePrefix}.${slug.replace(/-/g, "")}`,
    useDefault: flags.yes,
    validate: validateBundleId,
  });

  const feature = normalizeFeature(
    flags.feature ??
      (await promptText({
        message: "Primary feature module (lowercase, e.g. items, events, reels)",
        initialValue: DEFAULTS.feature,
        useDefault: flags.yes,
      })),
  );
  const featureError = validateFeature(feature);
  if (featureError) {
    p.cancel(featureError);
    process.exit(1);
  }

  const accent =
    flags.accent ??
    (await promptText({
      message: "Accent color (hex)",
      initialValue: DEFAULTS.accent,
      useDefault: flags.yes,
      validate: validateAccent,
    }));
  const accentError = validateAccent(accent);
  if (accentError) {
    p.cancel(accentError);
    process.exit(1);
  }

  const targetDir = path.resolve(
    flags.dir ??
      (await promptText({
        message: "Target directory",
        initialValue: path.join(os.homedir(), "Projects", slug),
        useDefault: flags.yes,
      })),
  );
  const dirError = dirIsUsable(targetDir);
  if (dirError) {
    p.cancel(dirError);
    process.exit(1);
  }

  return {
    appName,
    slug,
    bundleId,
    appGroup: `group.${bundleId}`,
    feature,
    featurePascal: toPascal(feature),
    accent,
    targetDir,
    appleTeamId: DEFAULTS.appleTeamId,
    appleId: DEFAULTS.appleId,
    expoOwner: DEFAULTS.expoOwner,
    dbName: `${slug.replace(/-/g, "")}.db`,
  };
}

async function main(): Promise<void> {
  const flags = parseArgs(process.argv.slice(2));

  p.intro(pc.bgYellow(pc.black(" create-mt-app ")));
  const config = await collectConfig(flags);

  p.note(
    [
      `App        ${config.appName}`,
      `Slug       ${config.slug}`,
      `Bundle     ${config.bundleId}`,
      `Feature    ${config.feature}`,
      `Accent     ${config.accent}`,
      `Directory  ${config.targetDir}`,
    ].join("\n"),
    "Configuration",
  );

  if (!flags.yes) {
    const proceed = await p.confirm({ message: "Scaffold with this configuration?" });
    if (p.isCancel(proceed) || !proceed) {
      p.cancel("Cancelled.");
      process.exit(1);
    }
  }

  const templateDir = path.resolve(fileURLToPath(import.meta.url), "../../template");

  const spinner = p.spinner();
  spinner.start("Writing project files");
  await scaffoldTemplate(templateDir, config.targetDir, buildTokens(config));
  spinner.stop("Project files written");

  if (flags.skipInstall) {
    p.outro("Scaffolded (install skipped). Run npm install + npx expo install manually.");
    return;
  }

  p.log.step("Installing dependencies (latest, resolved by expo install)");
  await installDependencies(config.targetDir);
  await writeAgentsFile(config.targetDir);

  p.log.step("Generating initial Drizzle migration");
  await generateMigrations(config.targetDir);

  p.log.step("Verifying (tsc, jest, biome)");
  const result = await verify(config.targetDir);
  for (const [check, ok] of Object.entries(result)) {
    p.log.info(`${ok ? pc.green("✓") : pc.red("✗")} ${check}`);
  }

  if (!flags.skipGit) {
    const committed = await initGit(config.targetDir, config.appName);
    p.log.info(committed ? "git repository initialized" : pc.yellow("git init/commit failed (skipped)"));
  }

  const allPassed = result.typecheck && result.tests && result.lint;
  p.note(
    [
      `cd ${config.targetDir}`,
      "1. Add RevenueCat keys to .env (see .env.example)",
      "2. npx eas init  (link the EAS project)",
      "3. npm run ios   (native build — widget & purchases need a dev client, not Expo Go)",
      "4. Write content/privacy/<slug>.mdx in ~/Projects/my-portfolio and publish it",
      "5. Read CLAUDE.md + DESIGN.md — they encode every convention for AI-assisted work",
    ].join("\n"),
    "Next steps",
  );
  p.outro(
    allPassed
      ? pc.green(`${config.appName} is ready.`)
      : pc.yellow(`${config.appName} scaffolded, but some checks failed — see output above.`),
  );
  if (!allPassed) process.exitCode = 1;
}

main().catch((error) => {
  p.log.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
