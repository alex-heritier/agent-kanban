# agent-kanban Electron + GitHub Pages scaffold

Basic app scaffold where the same frontend in `pages/` works in both Electron and GitHub Pages.

## Run desktop app

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start Electron:
   ```bash
   npm start
   ```

## View on GitHub Pages

GitHub Pages serves static files, so the web frontend is stored in `pages/`.

1. Push this repository to GitHub.
2. In **Settings → Pages**:
   - **Source**: `Deploy from a branch`
   - **Branch**: choose your branch
   - **Folder**: `/pages`
3. Save, then open the published URL.

The page loads in regular browser mode on GitHub Pages, and shows Electron runtime metadata when loaded through Electron.
