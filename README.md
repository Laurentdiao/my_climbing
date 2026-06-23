# Climbing Log

A mobile-first static personal climbing record website, deployed on GitHub Pages.

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS
- Zod (data validation)
- Vitest (unit tests)
- Recharts (statistics charts)
- GitHub Actions + GitHub Pages (CI/CD)

## Local Development

```bash
npm install
npm run dev          # Start dev server at http://localhost:5173
npm run test         # Run unit tests
npm run validate:data # Validate climbing-log.json
npm run build        # Build for production
```

## Project Structure

```
src/
  data/                    # Static JSON data
    climbing-log.json      # All climbing records
  features/climbing/
    domain/                # Types, schemas, stats logic
    adapters/              # Data loading
    components/            # UI components
  pages/                   # Route pages
  scripts/                 # Validation scripts
```

## How to Update Records

You can use the `/editor` page to prepare changes in the browser, then publish them to GitHub with a fine-grained token. For convenience on your own phone, the token is saved in that browser's `localStorage` so you only need to enter it once. Use the **清除** button in the editor if you want to remove it.

Manual Git workflow:

1. Edit `src/data/climbing-log.json` with your new sessions.
2. Run `npm run validate:data` to check for errors.
3. Run `npm run test` to ensure nothing breaks.
4. Run `npm run build` to verify the build passes.
5. Commit and push:

```bash
git add src/data/climbing-log.json
git commit -m "data: add session at [gym name]"
git push origin main
```

GitHub Actions will automatically build and deploy to GitHub Pages.

## Data Fields

### siteTitle

Global site title shown in the top nav bar. Shared by all climbers.

### User

| Field | Description |
|-------|-------------|
| id | Stable unique ID (lowercase letters, numbers, hyphens). Renaming a user does **not** change the id, so all their sessions auto-sync. |
| name | Display name / nickname, supports Chinese characters |
| bio | Personal bio (optional) |
| homeGym | Home gym id, references `gyms[].id` (optional) |
| color | UI tag color |

### Session

| Field | Description |
|-------|-------------|
| id | Unique ID, e.g. `YYYY-MM-DD-gym-name` |
| climbedAt | Date in `YYYY-MM-DD` format |
| gymId | References a gym in `gyms[]` |
| userId | References a climber in `users[]` |
| timeOfDay | `morning`, `afternoon`, or `evening` |
| notes | Optional public notes |
| entries | Array of problem entries |

### Entry

| Field | Description |
|-------|-------------|
| id | Unique entry ID |
| discipline | `bouldering` or `lead` |
| gradeLabel | Display grade, e.g. `V3` or `5.10a` |
| gradeRank | Numeric rank for sorting |
| quantity | Number of problems (use for batches) |
| notes | Entry notes (optional) |
| videoUrl | External video link (optional) |
| videoPlatform | `xiaohongshu`, `bilibili`, etc. (optional) |
| videoTitle | Video title (optional) |

## How to Deploy to GitHub Pages

1. Create a GitHub repository.
2. Push this project to the repository:

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

3. Go to repository **Settings > Pages**.
4. Under **Build and deployment**, select **GitHub Actions** as the source.
5. The site will be published at `https://YOUR_USERNAME.github.io/YOUR_REPO/`.

If using a `<username>.github.io` repository, the site will be at `https://YOUR_USERNAME.github.io/`. In that case, set `base: "/"` in `vite.config.ts`.

## Constraints

- No server, no database, no private backend login.
- Data is stored in `src/data/climbing-log.json` and versioned by Git.
- Video files are NOT stored in this repo. Only external links are recorded.
- All content in the data file is public.
- Do not commit GitHub tokens, `.env` files, private notes, or unpublished video links.
- Do not use the editor token save feature on shared or untrusted devices.
