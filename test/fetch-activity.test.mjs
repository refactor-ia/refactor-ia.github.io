import assert from "node:assert/strict";
import test from "node:test";
import {
  buildActivity,
  enrichPullRequests,
  fetchMostViewed,
  normalizeGithubEvents,
  parseAtomFeed,
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

test("enriches trimmed pull requests with their real title", async () => {
  const items = [
    {
      type: "pr",
      repo: "refactor-ia/site",
      date: "2026-10-15",
      action: "opened",
      title: "#55",
      url: "https://github.com/refactor-ia/site/pull/55",
    },
    {
      type: "release",
      repo: "refactor-ia/site",
      date: "2026-10-14",
      title: "v1",
      url: "u",
    },
    {
      type: "pr",
      repo: "refactor-ia/site",
      date: "2026-10-13",
      action: "merged",
      title: "#56",
      url: "https://github.com/refactor-ia/site/pull/56",
    },
  ];
  const calls = [];
  const getPull = async (repo, number) => {
    calls.push(`${repo}#${number}`);
    if (number === 56) throw new Error("boom");
    return { title: "feat: now page" };
  };
  const enriched = await enrichPullRequests(items, getPull);
  assert.deepEqual(calls, ["refactor-ia/site#55", "refactor-ia/site#56"]);
  assert.equal(enriched[0].title, "#55 feat: now page");
  assert.equal(enriched[1].title, "v1");
  assert.equal(
    enriched[2].title,
    "#56",
    "keeps the fallback when the lookup fails",
  );
});

test("keeps only the latest event of each pull request", () => {
  const pr = (id, action, createdAt) => ({
    id,
    type: "PullRequestEvent",
    public: true,
    repo: { name: "refactor-ia/site" },
    created_at: createdAt,
    payload: {
      action,
      number: 57,
      pull_request: { number: 57, merged: action === "closed" },
    },
  });
  const items = normalizeGithubEvents(
    [
      pr("1", "opened", "2026-10-16T09:00:00Z"),
      pr("2", "closed", "2026-10-16T10:00:00Z"),
    ],
    { now },
  );
  assert.deepEqual(
    items.map((i) => i.action),
    ["merged"],
  );
});

test("ranks a channel's uploads by views through the Data API", async () => {
  const requests = [];
  const pages = {
    first: {
      items: [1, 2].map((n) => ({ contentDetails: { videoId: `v${n}` } })),
      nextPageToken: "p2",
    },
    p2: { items: [{ contentDetails: { videoId: "v3" } }] },
  };
  const get = async (url) => {
    const u = new URL(url);
    requests.push(u.pathname.split("/").pop());
    assert.equal(u.searchParams.get("key"), "secret");
    if (u.pathname.endsWith("playlistItems")) {
      assert.equal(u.searchParams.get("playlistId"), "UUabc");
      return pages[u.searchParams.get("pageToken") ?? "first"];
    }
    assert.equal(u.searchParams.get("id"), "v1,v2,v3");
    return {
      items: [
        {
          id: "v1",
          snippet: { title: "Uno", publishedAt: "2026-10-01T10:00:00Z" },
          statistics: { viewCount: "10" },
        },
        {
          id: "v2",
          snippet: {
            title: "Dos &amp; tres",
            publishedAt: "2026-09-01T10:00:00Z",
          },
          statistics: { viewCount: "300" },
        },
        {
          id: "v3",
          snippet: { title: "Tres", publishedAt: "2026-08-01T10:00:00Z" },
          statistics: {},
        },
      ],
    };
  };

  const videos = await fetchMostViewed(
    { channel: "@Test", id: "UCabc" },
    { apiKey: "secret", get, limit: 2 },
  );

  assert.deepEqual(requests, ["playlistItems", "playlistItems", "videos"]);
  assert.deepEqual(videos, [
    {
      id: "v2",
      title: "Dos & tres",
      url: "https://www.youtube.com/watch?v=v2",
      published: "2026-09-01T10:00:00.000Z",
      channel: "@Test",
      views: 300,
    },
    {
      id: "v1",
      title: "Uno",
      url: "https://www.youtube.com/watch?v=v1",
      published: "2026-10-01T10:00:00.000Z",
      channel: "@Test",
      views: 10,
    },
  ]);
});

test("rejects a Data API error payload", async () => {
  const get = async () => ({ error: { message: "API key not valid" } });
  await assert.rejects(
    fetchMostViewed({ channel: "@Test", id: "UCabc" }, { apiKey: "bad", get }),
    /API key not valid/,
  );
});

test("adds the popular list to the activity document", () => {
  const doc = buildActivity({
    github: [],
    videos: [],
    popular: [{ id: "a" }],
    now,
  });
  assert.deepEqual(doc.popular, [{ id: "a" }]);
});

test("parses the barbat.dev Atom feed into newest-first articles", () => {
  const xml = `<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>https://barbat.dev/blog/old/</id>
    <title>Old &amp; gold</title>
    <summary>First summary.</summary>
    <link rel="alternate" type="text/html" href="https://barbat.dev/blog/old/" />
    <published>2026-09-01T00:00:00.000Z</published>
  </entry>
  <entry>
    <id>https://barbat.dev/blog/new/</id>
    <title>New post</title>
    <summary>Second summary.</summary>
    <link href="https://barbat.dev/blog/new/" />
    <updated>2026-10-02T00:00:00.000Z</updated>
  </entry>
</feed>`;
  assert.deepEqual(parseAtomFeed(xml, { limit: 5 }), [
    {
      title: "New post",
      summary: "Second summary.",
      url: "https://barbat.dev/blog/new/",
      published: "2026-10-02T00:00:00.000Z",
    },
    {
      title: "Old & gold",
      summary: "First summary.",
      url: "https://barbat.dev/blog/old/",
      published: "2026-09-01T00:00:00.000Z",
    },
  ]);
  assert.equal(parseAtomFeed(xml, { limit: 1 }).length, 1);
});

test("buildActivity includes articles", () => {
  const articles = [{ title: "A", summary: "", url: "u", published: "p" }];
  const doc = buildActivity({ github: [], videos: [], articles, now });
  assert.deepEqual(doc.articles, articles);
});
