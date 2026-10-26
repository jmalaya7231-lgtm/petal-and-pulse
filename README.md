# Petal & Pulse 🌷

*Grow with every heartbeat.*

A minimalist pink study website for a nursing student: a PDF study library, highlighting,
flashcards, practice quizzes, a planner with a Pomodoro timer, progress tracking and a few
personal notes.

## Features

- Upload text-based PDFs and read them as they look in the original file, or in a clean text view
- Highlight important text in three colors, add notes, and turn a highlight into a flashcard
- Flashcards and quizzes written by hand, or imported from text (Paste & Import)
- Planner with tasks, quiz and exam reminders, a daily checklist and a Pomodoro timer
- Progress page built only from real activity
- Personal notes that appear before quizzes, on breaks and after goals
- Backup and restore of saved data

## Privacy and data

- Everything is saved **in the user's own browser** (localStorage and IndexedDB).
- Nothing is uploaded to a server. PDFs are read on the device.
- Data does **not** sync between devices, isn't encrypted and isn't backed up.
  Use the Backup page to save a copy. Backups hold text, highlights, cards, quizzes and
  notes, but not the original PDF copies.
- The website's code is public, including the built-in messages in `src/data/notes.js`.

## Tech

React, Vite, JavaScript, custom CSS, Lucide icons, PDF.js (`pdfjs-dist`), React Router (HashRouter).

## Run it locally

Requires Node 20.19+ (or 22.12+).

```bash
npm install
npm run dev
```

Other commands:

```bash
npm run build     # build the site into /dist
npm run preview   # preview the built site
```

## Personalize

- Edit the built-in messages in `src/data/notes.js`.
- Change the greeting name from the Home page.

## Deploy (GitHub Pages)

1. Set `REPO_NAME` in `vite.config.js` to the repository name.
2. Push to the `main` branch.
3. In the repository: Settings, then Pages, then Source: **GitHub Actions**.
4. The workflow in `.github/workflows/deploy.yml` builds and publishes the site.

## Disclaimer

Study material imported from other tools can contain mistakes. Check everything against
instructors' materials and current clinical guidelines.