import assert from "node:assert/strict";
import test from "node:test";
import {
  buildActivity,
  normalizeGithubEvents,
  parseYoutubeFeed,
} from "../scripts/fetch-activity.mjs";

const now = new Date("2026-10-16T12:00:00Z");

const push = (id, repo, createdAt, size = 1, isPublic = true) => ({
  id,
  type: "PushEvent",
  public: isPublic,
  repo: { name: repo },
  created_at: createdAt,
  payload: { size, ref: "refs/heads/main" },
});

test("groups commits per repo and day and keeps releases and PRs", () => {
  const items = normalizeGithubEvents(
    [
      push("1", "refactor-ia/site", "2026-10-15T10:00:00Z", 2),
      push("2", "refactor-ia/site", "2026-10-15T18:00:00Z", 3),
      push("3", "barbatdev/dots", "2026-10-14T09:00:00Z"),
      {
        id: "4",
        type: "ReleaseEvent",
        public: true,
        repo: { name: "refactor-ia/site" },
        created_at: "2026-10-13T09:00:00Z",
        payload: {
          action: "published",
          release: {
            name: "v1.1.0",
            tag_name: "v1.1.0",
            html_url: "https://github.com/refactor-ia/site/releases/tag/v1.1.0",
          },
        },
      },
      {
        id: "5",
        type: "PullRequestEvent",
        public: true,
        repo: { name: "refactor-ia/site" },
        created_at: "2026-10-12T09:00:00Z",
        payload: {
          action: "closed",
          pull_request: {
            title: "feat: now page",
            number: 7,
            merged: true,
            html_url: "https://github.com/refactor-ia/site/pull/7",
          },
        },
      },
    ],
    { now },
  );

  assert.deepEqual(
    items.map((i) => [i.type, i.repo, i.date]),
    [
      ["commits", "refactor-ia/site", "2026-10-15"],
      ["commits", "barbatdev/dots", "2026-10-14"],
      ["release", "refactor-ia/site", "2026-10-13"],
      ["pr", "refactor-ia/site", "2026-10-12"],
    ],
  );
  assert.equal(items[0].count, 5);
  assert.equal(items[0].url, "https://github.com/refactor-ia/site/commits");
  assert.equal(items[2].title, "v1.1.0");
  assert.equal(items[3].title, "feat: now page");
  assert.equal(items[3].action, "merged");
});

test("drops private, old, duplicate and unrelated events", () => {
  const items = normalizeGithubEvents(
    [
      push("1", "refactor-ia/site", "2026-10-15T10:00:00Z", 1, false),
      push("2", "refactor-ia/site", "2026-06-01T10:00:00Z"),
      push("3", "refactor-ia/site", "2026-10-15T10:00:00Z"),
      push("3", "refactor-ia/site", "2026-10-15T10:00:00Z"),
      {
        id: "9",
        type: "WatchEvent",
        public: true,
        repo: { name: "x/y" },
        created_at: "2026-10-15T10:00:00Z",
        payload: {},
      },
      {
        id: "10",
        type: "PullRequestEvent",
        public: true,
        repo: { name: "x/y" },
        created_at: "2026-10-15T10:00:00Z",
        payload: {
          action: "closed",
          pull_request: { title: "t", merged: false, html_url: "u" },
        },
      },
    ],
    { now },
  );
  assert.equal(items.length, 1);
  assert.equal(items[0].count, 1);
});

test("handles trimmed pull request payloads from the Events API", () => {
  const items = normalizeGithubEvents(
    [
      {
        id: "1",
        type: "PullRequestEvent",
        public: true,
        repo: { name: "refactor-ia/site" },
        created_at: "2026-10-15T10:00:00Z",
        payload: {
          action: "opened",
          number: 55,
          pull_request: { number: 55, url: "https://api.github.com/x" },
        },
      },
    ],
    { now },
  );
  assert.equal(items[0].title, "#55");
  assert.equal(items[0].url, "https://github.com/refactor-ia/site/pull/55");
});

test("caps the number of items", () => {
  const events = Array.from({ length: 50 }, (_, n) =>
    push(String(n), `refactor-ia/r${n}`, "2026-10-15T10:00:00Z"),
  );
  assert.equal(normalizeGithubEvents(events, { now, limit: 30 }).length, 30);
});

test("rejects a non-list GitHub payload", () => {
  assert.throws(
    () =>
      normalizeGithubEvents({ message: "API rate limit exceeded" }, { now }),
    /API rate limit exceeded/,
  );
});

test("parses the YouTube RSS feed", () => {
  const xml = `<?xml version="1.0"?><feed xmlns:yt="http://www.youtube.com/xml/schemas/2015">
  <entry><yt:videoId>abc123</yt:videoId><title>Refactor &amp; test</title>
  <published>2026-10-10T10:00:00+00:00</published></entry>
  <entry><yt:videoId>def456</yt:videoId><title>Second</title>
  <published>2026-10-01T10:00:00+00:00</published></entry></feed>`;
  const videos = parseYoutubeFeed(xml, { channel: "@RefactorIA", limit: 1 });
  assert.deepEqual(videos, [
    {
      id: "abc123",
      title: "Refactor & test",
      url: "https://www.youtube.com/watch?v=abc123",
      published: "2026-10-10T10:00:00.000Z",
      channel: "@RefactorIA",
    },
  ]);
});

test("builds the activity document with a timestamp", () => {
  const doc = buildActivity({ github: [], videos: [], now });
  assert.deepEqual(doc, {
    generatedAt: "2026-10-16T12:00:00.000Z",
    github: [],
    videos: [],
  });
});
