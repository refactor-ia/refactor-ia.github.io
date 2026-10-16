# Now, projects and activity (#31)
Objective: one data source in this repo feeds refactoria.dev and the refactor-ia org profile README. Branch: feat/now-activity. Delivery: ask-on-risk. Test runner: node:test (npm test).

## Specs
- S1 (issue #31): "Show a log of recent public activity in the refactor-ia GitHub org." Only public repositories; fetched at build time; "no token in the client".
- S2 (decision, prior session): sections Now, Projects, Activity (90-day public events), Built with. The home shows a summary and /now shows everything.
- S3 (decision): a daily Action refreshes both the site and the org profile README.
- S4 (issue #31 comment): "latest videos from both channels (@RefactorIA, @RefactorIADevs) via the public RSS feed". No API key.
- S5 (issue #31 comment): "most viewed / view counts via YouTube Data API v3, once an API key is stored as a repo secret." (later step)
- S6 (user, 2026-10-15): "Tiene mucho mas valor meter/mostrar lo de mis contribuciones en github" — GitHub contributions replace hand-picked repo chips.

## Tasks
- T1 [S1,S4,S6] fetch script → src/data/generated/activity.json (GitHub public events + YouTube RSS). Route: inline. Status: done (7 tests; real fetch OK).
- T2 [S2] /now page + home summary components on DS. Route: inline. Status: pending.
- T3 [S3] daily GitHub Action: run fetch, commit data, rebuild/deploy; render org profile README. Route: inline. Status: pending. Risk item 5 (CI).
- T4 [S5] YouTube Data API most viewed (needs secret). Status: blocked on API key.

## Log
- L1 (2026-10-15, user): "dale ahora me quedan 10 minutos"
- L2: Open decision from issue body — which event types to show (commits, releases, PRs). Pending maintainer answer.
- L3 (2026-10-15, user): "yo metería los 3 ... me chupa un huevo si hay mucho. Obviamente que tiene que quedar bien presentado y contenido ... no se eso te lo dejjo a vos" → show commits, releases and PRs; presentation and containment (grouping, limits) are the agent's call.
- L4: YouTube channel IDs: @RefactorIA = UCKmxvQBWXbN2UOpPVmxAOJQ, @RefactorIADevs = UC7GZzyf9BMjMnXoYxsGWAxQ. Contributions should include the personal account (barbatdev) public events, not only the org.
- L5: Unauthenticated GitHub API call from the dev machine returned a non-list response (likely rate limit); T1 should use GITHUB_TOKEN in the Action (public scope only) and handle error payloads.
- L6 (2026-10-16): T1 done. The Events API trims PullRequestEvent to ids (no title, merged or html_url); fallbacks are "#<number>" and the repo pull URL. Fetch failures exit 1 without touching the existing file.
