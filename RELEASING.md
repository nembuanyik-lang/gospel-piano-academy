# Releasing a new version

## Every release

- [ ] `npm ci` (or `npm run pin` if you are deliberately upgrading tools; then commit both package files)
- [ ] `npm run check` passes
- [ ] `npm test` passes
- [ ] `npm run e2e` passes (after `npx playwright install chromium` once)
- [ ] `npm start`: click through onboarding, one lesson, Song Lab, Profile > Your data and About
- [ ] Version raised in **both** `package.json` and `app/js/about.js` (`APP_VERSION`)
- [ ] `CHANGELOG.md` updated, and the newest entry added to `CHANGES` in `app/js/about.js`
- [ ] Commit, push, wait for the green check on GitHub
- [ ] `git tag vX.Y.Z && git push origin vX.Y.Z`
- [ ] When the release appears, install it on one Windows computer over the previous version and confirm progress is still there

## Before 2.0 is announced (one-off)

- [ ] Test with two or three MIDI keyboards on Windows and on a Mac
- [ ] Test the guitar tuner with a real microphone
- [ ] Run Timing calibration on a laptop with Bluetooth headphones (large delay) and check play-along scores feel fair
- [ ] Screen-reader pass with NVDA (Windows): onboarding, a lesson, a quiz, Profile > Your data
- [ ] Two-week beta with a few church musicians

## Protecting the repository

Anyone who can publish a release can push code to every installed copy, so:

- [ ] Two-factor authentication on every GitHub account with write access
- [ ] Branch protection on `main` (require the test job to pass)
- [ ] Tag protection for `v*` tags (Settings > Rules)

## Code signing (removes the "Windows protected your PC" warning)

Signing needs a certificate you buy; the build uses it automatically when these repository secrets exist
(Settings > Secrets and variables > Actions). Without them, installers are built unsigned.

**Windows** — an OV or EV code-signing certificate exported as a `.pfx` file, or a cloud signing service.

- `WIN_CSC_LINK`: the `.pfx` file encoded in base64
- `WIN_CSC_KEY_PASSWORD`: its password

Microsoft's Azure Trusted Signing is often the cheapest option; electron-builder supports it through
`win.azureSignOptions` (see the electron-builder documentation for your installed version).

**macOS** — an Apple Developer account (yearly fee), a "Developer ID Application" certificate, and notarisation.

- `MAC_CSC_LINK`, `MAC_CSC_KEY_PASSWORD`: the certificate (`.p12`, base64) and its password
- `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`: used by electron-builder to notarise the app

After the first signed Windows release, add `"publisherName": "<the name on your certificate>"` to the `win`
section of `package.json` so the updater refuses any update that is not signed by you.

## If something goes wrong

- The build job fails on "Tag matches package.json version": delete the tag (`git tag -d vX.Y.Z && git push origin :refs/tags/vX.Y.Z`), fix the version, tag again.
- A bad release went out: publish a fixed version with a higher number. Learners can also restore any snapshot under Profile > Your data.
- Support: ask the learner to open Help > Open progress folder and send `logs/main.log` together with an exported backup.
