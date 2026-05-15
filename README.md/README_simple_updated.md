# GetLaunched Autotest

## Install dependencies

Open terminal in the project folder and run:

```bash
npm install
```

This command installs all required libraries for the project.

---

## Run tests in headed mode

```bash
npm run test:headed
```

---

## Project structure

```txt
tests/
├── 01-login.spec.js
├── 02-create-project.spec.js
├── auth.setup.js
├── ...
```

---

## Notes

- Tests are written with Playwright
- Chromium is used as the main browser
- Auth session is stored automatically
- New test flows can be added inside the tests folder
