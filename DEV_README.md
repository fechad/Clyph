# Publishing Guide for `clyph` CLI

This guide explains how to publish the `clyph` CLI tool to the npm registry.

---

## 1. Prepare for Publishing

- **Remove sensitive data**: Ensure `.env` and any files with secrets are not included in the package. Add them to `.gitignore` and `.npmignore`.
- **Build the project**:  
  ```sh
  npm run build
  ```
  This compiles TypeScript to the `dist/` folder.

- **Check the package contents**:  
  Run:
  ```sh
  npm pack --dry-run
  ```
  This shows what files will be published.

---

## 2. Update `package.json`

- Ensure the `name`, `version`, `description`, and `bin` fields are correct.
- The `bin` field should look like:
  ```json
  "bin": {
    "clyph": "./dist/main.js"
  }
  ```

---

## 3. Login to npm

If you haven't already, log in to your npm account:
```sh
npm login
```

---

## 4. Publish

To publish the package:
```sh
npm publish --access public
```
- Use `--access public` for public packages.

---

## 5. Install Globally (for users)

After publishing, users can install globally with:
```sh
npm install -g clyph
```
Then run the CLI anywhere with:
```sh
clyph
```

---

## 6. Notes

- **.npmignore**: Use this file to exclude everything except `dist/`, `package.json`, `README.md`, and other essentials.
- **Versioning**: Bump the version in `package.json` before each publish.
- **Testing**: Always test the CLI locally before publishing using `npm link`.

---
```<!-- filepath: /Users/fedwi/Documents/2025 Varias/ChatCLI/DEV_README.md -->

# Publishing Guide for `clyph` CLI

This guide explains how to publish the `clyph` CLI tool to the npm registry.

---

## 1. Prepare for Publishing

- **Remove sensitive data**: Ensure `.env` and any files with secrets are not included in the package. Add them to `.gitignore` and `.npmignore`.
- **Build the project**:  
  ```sh
  npm run build
  ```
  This compiles TypeScript to the `dist/` folder.

- **Check the package contents**:  
  Run:
  ```sh
  npm pack --dry-run
  ```
  This shows what files will be published.

---

## 2. Update `package.json`

- Ensure the `name`, `version`, `description`, and `bin` fields are correct.
- The `bin` field should look like:
  ```json
  "bin": {
    "clyph": "./dist/main.js"
  }
  ```

---

## 3. Login to npm

If you haven't already, log in to your npm account:
```sh
npm login
```

---

## 4. Publish

To publish the package:
```sh
npm publish --access public
```
- Use `--access public` for public packages.

---

## 5. Publish -  test

To publish the package in a local test Verdaccio registry:
```sh
npm install --global verdaccio
verdaccio
```
In a new terminal:
1. Add user
```sh
npm adduser --registry http://localhost:4873/
username: admin
password: ****
email: test@gmail.com
```
2. Publish
```sh
npm run build
npm publish --registry http://localhost:4873/
```
3. Install and test
```sh
npm install -g clyph --registry http://localhost:4873
```
4. To unpublish
```sh
npm unpublish clyph --registry http://localhost:4873 --force
```

---

## 6. Install Globally (for users)

After publishing, users can install globally with:
```sh
npm install -g clyph
```
Then run the CLI anywhere with:
```sh
clyph
```

---

## 7. Notes

- **.npmignore**: Use this file to exclude everything except `dist/`, `package.json`, `README.md`, and other essentials.
- **Versioning**: Bump the version in `package.json` before each publish.
- **Testing**: Always test the CLI locally before publishing using `npm link`.

---