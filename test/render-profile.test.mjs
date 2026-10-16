import assert from "node:assert/strict";
import test from "node:test";
import {
  injectSection,
  renderActivitySection,
} from "../scripts/render-profile.mjs";

const activity = {
  generatedAt: "2026-10-16T12:00:00.000Z",
  github: [
    {
      type: "release",
      repo: "refactor-ia/cortex",
      date: "2026-10-16",
      title: "v0.1.0",
      url: "https://github.com/refactor-ia/cortex/releases/tag/v0.1.0",
    },
    {
      type: "commits",
      repo: "barbatdev/quorb",
      date: "2026-10-15",
      count: 3,
      url: "https://github.com/barbatdev/quorb/commits",
    },
  ],
  videos: [
    {
      id: "a",
      title: "Video | uno",
      url: "https://www.youtube.com/watch?v=a",
      published: "2026-10-15T10:00:00.000Z",
      channel: "@RefactorIADevs",
    },
  ],
};

test("renders a markdown activity section between markers", () => {
  const section = renderActivitySection(activity, { limit: 5 });
  assert.match(section, /^<!-- activity:start -->\n/);
  assert.match(section, /\n<!-- activity:end -->$/);
  assert.match(
    section,
    /\[refactor-ia\/cortex\]\(https:\/\/github\.com\/refactor-ia\/cortex\/releases\/tag\/v0\.1\.0\)/,
  );
  assert.match(section, /3 commits/);
  assert.match(
    section,
    /\[Video \\\| uno\]\(https:\/\/www\.youtube\.com\/watch\?v=a\)/,
  );
  assert.match(section, /https:\/\/refactoria\.dev\/now/);
});

test("replaces an existing section and keeps the rest of the README", () => {
  const readme =
    "# Title\n\n<!-- activity:start -->\nold\n<!-- activity:end -->\n\nFooter\n";
  const out = injectSection(
    readme,
    "<!-- activity:start -->\nnew\n<!-- activity:end -->",
  );
  assert.equal(
    out,
    "# Title\n\n<!-- activity:start -->\nnew\n<!-- activity:end -->\n\nFooter\n",
  );
});

test("inserts the section before the closing rule when markers are missing", () => {
  const readme = "# Title\n\nBody\n\n---\n\nBadge\n";
  const out = injectSection(
    readme,
    "<!-- activity:start -->\nnew\n<!-- activity:end -->",
  );
  assert.equal(
    out,
    "# Title\n\nBody\n\n<!-- activity:start -->\nnew\n<!-- activity:end -->\n\n---\n\nBadge\n",
  );
});
