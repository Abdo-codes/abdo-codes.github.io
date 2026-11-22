# Amphetamine, KeepingYouAwake & caffeinate: Switching Triggers

Checked: 2026-11-22

| Trigger | Category | Evidence / Source | Verified on live info |
| --- | --- | --- | --- |
| Amphetamine is closed source (free on Mac App Store) and packs dozens of settings, triggers, power profiles, and optional closed-display helper binaries that many developers never touch | PRODUCT / SIMPLICITY | Mac App Store & `r/macapps` / `r/MacOS` discussions (checked 2026-11-22) | yes |
| KeepingYouAwake (MIT open source, 7,058 GitHub stars, last pushed 2026-08-15) is a clean timer/toggle wrapper around `caffeinate`, but does not automatically watch specific running apps and is not distributed via the Mac App Store sandbox | PRODUCT / LIMITS | `github.com/newmarcel/KeepingYouAwake` (checked 2026-11-22) | yes |
| Built-in `caffeinate` requires manually remembering to start and stop Terminal commands (or wrapping every command with `caffeinate -i <cmd>`) and stops if the terminal session closes | PRODUCT | Apple macOS `caffeinate` manual & `r/MacOS` discussions | yes |
| AI coding agents (Claude Code, Codex, Xcode builds, Ghostty sessions) run unattended for 20-120 minutes; leaving a manual keep-awake toggle on indefinitely drains battery after the session ends | PRODUCT | Developer workflows on macOS 14+ | yes |

Where Amphetamine, KeepingYouAwake, and caffeinate win (keep these honest on the page):
- **Amphetamine** wins if you need closed-lid MacBook keep-awake (clamshell without external display via its helper), Wi-Fi/USB/battery-level triggers, schedules, or keeping the screen itself awake.
- **KeepingYouAwake** wins if you want a classic one-click timed toggle ("stay awake for 1 hour / 5 hours / indefinitely") rather than app-triggered rules, or need support for macOS older than Sonoma 14.
- **`caffeinate`** wins if you want zero installed apps and only need to wrap a single shell command (`caffeinate -i make build`) or script.
- **Lungo / Caffeinated** win if you want Shortcuts automation or paid visual timer presets.
