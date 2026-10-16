// Renders the recent activity into the refactor-ia org profile README.
// Usage: node scripts/render-profile.mjs <path/to/profile/README.md>
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const START = "<!-- activity:start -->";
const END = "<!-- activity:end -->";
const ACTIVITY_FILE = "src/data/generated/activity.json";

const escape = (text) => text.replace(/([\\[\]|])/g, "\\$1");

const describe = (item) => {
  if (item.type === "commits")
    return item.count === 1 ? "1 commit" : `${item.count} commits`;
  if (item.type === "release") return `Release ${item.title}`;
  return `PR ${item.title} ${item.action === "merged" ? "mergeado" : "abierto"}`;
};

/** Markdown block with the latest activity and videos, wrapped in markers. */
export function renderActivitySection(activity, { limit = 8 } = {}) {
  const github = activity.github
    .slice(0, limit)
    .map(
      (item) =>
        `- \`${item.date}\` [${escape(item.repo)}](${item.url}): ${escape(describe(item))}`,
    );
  const videos = activity.videos
    .slice(0, 3)
    .map(
      (video) => `- [${escape(video.title)}](${video.url}) · ${video.channel}`,
    );

  return [
    START,
    "## Actividad reciente",
    "",
    ...github,
    "",
    "**Últimos videos**",
    "",
    ...videos,
    "",
    `Toda la actividad en [refactoria.dev/now](https://refactoria.dev/now). Se actualiza una vez por día.`,
    END,
  ].join("\n");
}

/** Replaces the marked section, or inserts it before the last horizontal rule. */
export function injectSection(readme, section) {
  const start = readme.indexOf(START);
  const end = readme.indexOf(END);
  if (start !== -1 && end > start) {
    return readme.slice(0, start) + section + readme.slice(end + END.length);
  }
  const rule = readme.lastIndexOf("\n---\n");
  if (rule === -1) return `${readme.trimEnd()}\n\n${section}\n`;
  return `${readme.slice(0, rule)}\n${section}\n${readme.slice(rule)}`;
}

async function main() {
  const target = process.argv[2];
  if (!target)
    throw new Error("Usage: node scripts/render-profile.mjs <README path>");
  const activity = JSON.parse(await readFile(ACTIVITY_FILE, "utf8"));
  const readme = await readFile(target, "utf8");
  await writeFile(
    target,
    injectSection(readme, renderActivitySection(activity)),
  );
  console.log(`Rendered activity into ${target}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
