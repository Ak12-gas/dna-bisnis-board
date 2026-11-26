# DNA BisnisBoard Generator

Static browser application for generating a 12-step DNA BisnisBoard with AI providers, competitor research, logo moodboards, and PNG/PDF export.

## GitHub Pages deployment

1. Push the complete repository, including `index.html` and the `src/` directory.
2. In GitHub, open **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.
4. Push to `main` again whenever a new deployment is needed.

The workflow in `.github/workflows/pages.yml` publishes the repository root as a static site. No build step or API key is required.

## Security notes

- Never commit Groq, Gemini, or custom-provider API keys. Keys are entered by the user and stored only in that browser's local storage.
- Use quota-limited provider keys. This is a client-side app; provider spending limits must be configured at the provider.
- Custom remote providers must use HTTPS. HTTP is allowed only for `localhost` development.
- Production debug panels are disabled, including requests with `?dev=1`.

## Local smoke test

Serve this folder over HTTP so ES modules behave like the deployed site. For example, use any local static server, then open `index.html` through that server and verify the browser console has no module errors.
