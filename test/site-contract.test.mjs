import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { load } from "cheerio";

const dist = join(process.cwd(), "dist");
const readOutput = (path) => {
  const file = join(dist, path);
  assert.ok(existsSync(file), `Expected built output: ${path}`);
  return readFileSync(file, "utf8");
};

const links = {
  discord: "https://discord.gg/D3PhJ477Bj",
  githubOrg: "https://github.com/refactor-ia",
  githubCreator: "https://github.com/barbatdev",
  youtubeMain: "https://www.youtube.com/@RefactorIA",
  youtubeDevs: "https://www.youtube.com/@RefactorIADevs",
  spotify: "https://open.spotify.com/artist/22Udt5YIZaGRDuGVfSN03w",
  spotifyAlbum: "https://open.spotify.com/album/3RBxTEy92zSYDZNuctzUXh",
  appleMusic: "https://music.apple.com/us/artist/refactoria/6811690240",
  youtubeMusic: "https://www.youtube.com/channel/UCqDys5rhEVdb2_Of2ZeHMEw",
};

test("renders the Spanish public landing contract", () => {
  const html = readOutput("index.html");
  const $ = load(html);

  assert.equal($("html").attr("lang"), "es");
  assert.equal($("h1").length, 1);
  assert.match($("h1").text(), /RefactorIA/);
  assert.match(
    $("body").text(),
    /Modernize with engineering judgment\. No hype\./,
  );
  assert.equal($('a[href="#contenido"]').length, 1, "includes a skip link");
  assert.equal($("header").length, 1);
  assert.equal($("header nav").length, 1);
  assert.equal($("footer nav").length, 2);
  assert.equal($("main#contenido").length, 1);
  assert.equal($("footer").length, 1);

  assert.equal(
    $("title").text(),
    "RefactorIA | Modernize with engineering judgment. No hype.",
  );
  assert.match(
    $('meta[name="description"]').attr("content") ?? "",
    /comunidad/i,
  );
  assert.equal(
    $('link[rel="canonical"]').attr("href"),
    "https://refactoria.dev/",
  );
  assert.equal(
    $('meta[property="og:url"]').attr("content"),
    "https://refactoria.dev/",
  );
  assert.equal(
    $('meta[property="og:image"]').attr("content"),
    "https://refactoria.dev/og-image.png",
  );
  assert.equal($('meta[property="og:image:width"]').attr("content"), "1200");
  assert.equal($('meta[property="og:image:height"]').attr("content"), "630");
  assert.equal(
    $('meta[name="twitter:card"]').attr("content"),
    "summary_large_image",
  );
  assert.equal($('meta[name="theme-color"]').attr("content"), "#0b0714");

  assert.ok(
    $('a[href="' + links.discord + '"]').length >= 2,
    "links Discord twice or more",
  );
  assert.ok(
    $('a[href="' + links.githubOrg + '"]').length >= 2,
    "links the GitHub org twice or more",
  );
  assert.ok(
    $('a[href="' + links.youtubeMain + '"]').length >= 1,
    "links the main YouTube channel",
  );
  assert.ok(
    $('a[href="' + links.youtubeDevs + '"]').length >= 1,
    "links the Devs YouTube channel",
  );
  assert.ok(
    $('a[href="' + links.githubCreator + '"]').length >= 1,
    "links the creator GitHub profile",
  );
  assert.ok(
    $('a[href="' + links.spotify + '"]').length >= 1,
    "links the Spotify artist",
  );
  assert.ok(
    $('a[href="' + links.spotifyAlbum + '"]').length >= 1,
    "links the Spotify album",
  );
  assert.ok(
    $('a[href="' + links.appleMusic + '"]').length >= 1,
    "links the Apple Music artist",
  );
  assert.ok(
    $('a[href="' + links.youtubeMusic + '"]').length >= 1,
    "links the YouTube Music channel",
  );
  assert.ok(
    $('a[href="mailto:juan@refactoria.dev"]').length >= 1,
    "links the official contact email",
  );
  assert.ok(
    $("body").text().includes("juan@refactoria.dev"),
    "shows the official email as visible text",
  );
  assert.ok(
    $("body").text().includes("Juan Barbat"),
    "names Juan Barbat as visible text",
  );

  for (const category of [
    "Devs",
    "Labs",
    "TurboTips",
    "Snippetazos",
    "DevLore",
    "Migraciones",
  ]) {
    assert.ok(
      $("main").text().includes(category),
      `includes the ${category} category`,
    );
  }
  assert.ok(
    $("main").text().includes("RefactorIA Music"),
    "includes the music section",
  );
  assert.ok($("main").text().includes("P(DOOM)"), "includes the first single");

  const bodyText = $("body").text().toLowerCase();
  for (const forbiddenTerm of [
    "holawindev",
    "innit",
    "equipo",
    "team",
    "revolucionari",
    "disruptiv",
    "sinergia",
    "game-changer",
    "cutting-edge",
    "lorem ipsum",
  ]) {
    assert.ok(
      !bodyText.includes(forbiddenTerm),
      `does not publish ${forbiddenTerm} content`,
    );
  }
  assert.equal($("script[src]").length, 0, "ships no client-side JavaScript");
});

test("publishes structured identity data connecting RefactorIA, Juan Barbat and official channels", () => {
  const $ = load(readOutput("index.html"));
  const jsonLd = JSON.parse(
    $('script[type="application/ld+json"]').html() ?? "{}",
  );

  assert.equal(jsonLd["@context"], "https://schema.org");
  const graph = jsonLd["@graph"];
  const org = graph.find((node) => node["@type"] === "Organization");
  const person = graph.find((node) => node["@type"] === "Person");
  const website = graph.find((node) => node["@type"] === "WebSite");

  assert.equal(org.name, "RefactorIA");
  assert.equal(org.email, "juan@refactoria.dev");
  assert.equal(person.name, "Juan Barbat");
  assert.equal(person.url, "https://github.com/barbatdev");
  assert.equal(website.url, "https://refactoria.dev/");
  for (const sameAs of [
    links.githubOrg,
    links.youtubeMain,
    links.youtubeDevs,
  ]) {
    assert.ok(
      org.sameAs.includes(sameAs),
      `Organization sameAs includes ${sameAs}`,
    );
  }
});

test("publishes static fallback, crawl and visual metadata assets", () => {
  const fallbackPath = existsSync(join(dist, "404.html"))
    ? "404.html"
    : "404/index.html";
  const fallback = load(readOutput(fallbackPath));

  assert.equal(fallback("html").attr("lang"), "es");
  assert.equal(fallback("h1").length, 1);
  assert.match(fallback("h1").text(), /404/);

  const robots = readOutput("robots.txt");
  assert.match(
    robots,
    /Sitemap: https:\/\/refactoria\.dev\/sitemap-index\.xml/,
  );

  for (const asset of [
    "sitemap-index.xml",
    "favicon.svg",
    "favicon-512.png",
    "apple-touch-icon.png",
    "og-image.png",
  ]) {
    assert.ok(existsSync(join(dist, asset)), `includes ${asset}`);
  }
});
