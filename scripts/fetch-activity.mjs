// Fetches public GitHub activity and the latest YouTube videos at build time
// and writes them to src/data/generated/activity.json. No token reaches the client.
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUTPUT = "src/data/generated/activity.json";
const GITHUB_SOURCES = [
  "orgs/refactor-ia/events",
  "users/barbatdev/events/public",
];
const YOUTUBE_CHANNELS = [
  { channel: "@RefactorIA", id: "UCKmxvQBWXbN2UOpPVmxAOJQ" },
  { channel: "@RefactorIADevs", id: "UC7GZzyf9BMjMnXoYxsGWAxQ" },
];
const DAY_MS = 24 * 60 * 60 * 1000;

const repoUrl = (repo) => `https://github.com/${repo}`;

const toItem = (event) => {
  const repo = event.repo.name;
  const date = event.created_at.slice(0, 10);
  const { payload } = event;

  if (event.type === "PushEvent") {
    return {
      type: "commits",
      repo,
      date,
      count: payload.size ?? payload.commits?.length ?? 1,
      url: `${repoUrl(repo)}/commits`,
    };
  }
  if (event.type === "ReleaseEvent" && payload.action === "published") {
    const { release } = payload;
    return {
      type: "release",
      repo,
      date,
      title: release.name || release.tag_name,
      url: release.html_url,
    };
  }
  if (event.type === "PullRequestEvent") {
    // The Events API may trim the pull request to ids only, so title and url have fallbacks.
    const pr = payload.pull_request;
    const number = pr.number ?? payload.number;
    const merged =
      payload.action === "merged" || (payload.action === "closed" && pr.merged);
    const action = merged
      ? "merged"
      : payload.action === "opened"
        ? "opened"
        : null;
    if (!action) return null;
    return {
      type: "pr",
      repo,
      date,
      action,
      title: pr.title ?? `#${number}`,
      url: pr.html_url ?? `${repoUrl(repo)}/pull/${number}`,
    };
  }
  return null;
};

/**
 * Turns raw GitHub events into a short, newest-first feed of commits (grouped
 * per repo and day), published releases and opened or merged pull requests.
 */
export function normalizeGithubEvents(
  events,
  { now = new Date(), days = 90, limit = 30 } = {},
) {
  if (!Array.isArray(events)) {
    throw new Error(
      `Unexpected GitHub payload: ${events?.message ?? JSON.stringify(events)}`,
    );
  }
  const since = now.getTime() - days * DAY_MS;
  const seen = new Set();
  const items = [];
  const commitGroups = new Map();

  const sorted = [...events].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
  for (const event of sorted) {
    if (event.public === false || seen.has(event.id)) continue;
    if (Date.parse(event.created_at) < since) continue;
    seen.add(event.id);

    const item = toItem(event);
    if (!item) continue;
    // Events are newest first, so a merged PR hides its earlier "opened" event.
    if (item.type === "pr") {
      if (seen.has(item.url)) continue;
      seen.add(item.url);
    }
    if (item.type === "commits") {
      const key = `${item.repo}@${item.date}`;
      const group = commitGroups.get(key);
      if (group) {
        group.count += item.count;
        continue;
      }
      commitGroups.set(key, item);
    }
    items.push(item);
  }
  return items.slice(0, limit);
}

const decodeXml = (text) =>
  text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

/** Parses a YouTube channel RSS feed into the newest videos. */
export function parseYoutubeFeed(xml, { channel, limit = 5 }) {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
  const pick = (entry, tag) =>
    entry.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1]?.trim();
  return entries.slice(0, limit).map((entry) => {
    const id = pick(entry, "yt:videoId");
    return {
      id,
      title: decodeXml(pick(entry, "title") ?? ""),
      url: `https://www.youtube.com/watch?v=${id}`,
      published: new Date(pick(entry, "published")).toISOString(),
      channel,
    };
  });
}

/**
 * Fills in the real titles of pull requests, since the Events API trims them.
 * A failed lookup keeps the "#<number>" fallback.
 */
export async function enrichPullRequests(items, getPull) {
  return Promise.all(
    items.map(async (item) => {
      if (item.type !== "pr") return item;
      const number = Number(item.url.split("/").pop());
      try {
        const pull = await getPull(item.repo, number);
        return { ...item, title: `#${number} ${pull.title}` };
      } catch {
        return item;
      }
    }),
  );
}

export function buildActivity({ github, videos, now = new Date() }) {
  return { generatedAt: now.toISOString(), github, videos };
}

const githubHeaders = () => {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "refactoria.dev",
  };
  if (process.env.GITHUB_TOKEN)
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
};

async function fetchGithub(path) {
  const response = await fetch(`https://api.github.com/${path}?per_page=100`, {
    headers: githubHeaders(),
  });
  return response.json();
}

async function fetchPull(repo, number) {
  const response = await fetch(
    `https://api.github.com/repos/${repo}/pulls/${number}`,
    { headers: githubHeaders() },
  );
  if (!response.ok)
    throw new Error(`Pull ${repo}#${number} returned ${response.status}`);
  return response.json();
}

async function fetchYoutube({ channel, id }) {
  const response = await fetch(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${id}`,
  );
  if (!response.ok)
    throw new Error(`YouTube feed ${channel} returned ${response.status}`);
  return parseYoutubeFeed(await response.text(), { channel });
}

async function main() {
  const now = new Date();
  const events = (await Promise.all(GITHUB_SOURCES.map(fetchGithub))).flatMap(
    (payload) => {
      if (!Array.isArray(payload)) normalizeGithubEvents(payload);
      return payload;
    },
  );
  const videos = (await Promise.all(YOUTUBE_CHANNELS.map(fetchYoutube)))
    .flat()
    .sort((a, b) => b.published.localeCompare(a.published));

  const github = await enrichPullRequests(
    normalizeGithubEvents(events, { now }),
    fetchPull,
  );
  const activity = buildActivity({ github, videos, now });
  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify(activity, null, 2)}\n`);
  console.log(
    `Wrote ${activity.github.length} GitHub items and ${videos.length} videos to ${OUTPUT}`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    // Fail without touching the existing file so the last good data stays published.
    console.error(error.message);
    process.exit(1);
  });
}
