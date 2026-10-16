import data from "./generated/activity.json";

export interface ActivityItem {
  type: "commits" | "release" | "pr";
  repo: string;
  date: string;
  url: string;
  count?: number;
  title?: string;
  action?: "opened" | "merged";
}

export interface Video {
  id: string;
  title: string;
  url: string;
  published: string;
  channel: string;
}

export const GENERATED_AT: string = data.generatedAt;
export const GITHUB_ACTIVITY = data.github as ActivityItem[];
export const VIDEOS = data.videos as Video[];

/** Short, human label for one activity item. */
export function describe(item: ActivityItem): string {
  if (item.type === "commits") {
    return item.count === 1 ? "1 commit" : `${item.count} commits`;
  }
  if (item.type === "release") return `Release ${item.title}`;
  return `PR ${item.title} ${item.action === "merged" ? "mergeado" : "abierto"}`;
}

/** Repos with the most activity in the feed, busiest first. */
export function activeRepos(items: ActivityItem[], limit = 6) {
  const totals = new Map<string, number>();
  for (const item of items) {
    totals.set(item.repo, (totals.get(item.repo) ?? 0) + (item.count ?? 1));
  }
  return [...totals]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([repo]) => ({ repo, href: `https://github.com/${repo}` }));
}

const dateFormat = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

export const formatDate = (iso: string) => dateFormat.format(new Date(iso));
