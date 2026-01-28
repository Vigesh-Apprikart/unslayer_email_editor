# Project Overview

This is a React-based web application that integrates the Unlayer email editor. The application provides a user interface for designing emails and then viewing the generated JSON, HTML, and plain text output. It uses Vite for the build tooling, and the UI is styled with Tailwind CSS.

The architecture is modular, separating concerns into custom hooks for logic and dedicated components for UI. The main editor feature is orchestrated by the `Editor` component (`src/components/Editor/index.jsx`).

## Features

- **Email Design:** Users can create and edit email templates using the Unlayer drag-and-drop editor, which is encapsulated in the `UnlayerEditor` component.
- **Multiple Output Formats:** The application can display the email design in several formats, managed by the `EditorTabs` component:
    - **Design View:** The visual editor.
    - **JSON:** The raw Unlayer design data.
    - **HTML:** "Bulletproof" email-safe HTML generated from the design.
    - **Plain Text:** A text-only version of the email.
- **Save and Load:** Email designs are saved to the browser's `localStorage` and can be reloaded into the editor. This functionality is managed by the `useEmailEditor` hook.
- **Undo/Redo:** Standard undo and redo functionality is supported, also handled by the `useEmailEditor` hook.
- **Device Preview:** Users can switch between desktop and mobile views to check the responsiveness of their designs.
- **HTML Import:** The application can import existing HTML, parse it, and load it into the editor as a design, using the `ImportHtmlModal` component.
- **Clear Editor:** A function to clear the editor and start a new design, with a confirmation dialog from `ClearEditorModal`.
- **Copy to Clipboard:** Each of the JSON, HTML, and Plain Text tabs has a "Copy" button, with its state managed by the `useEmailData` hook.
- **Advanced Editor Configuration:** The Unlayer editor is configured with custom fonts, merge tags, and custom tool properties within the `UnlayerEditor` component.

## Building and Running

### Development

To run the application in development mode:

```bash
npm install
npm run dev
```

This will start a development server, and you can view the application in your browser.

### Building for Production

To create a production build of the application:

```bash
npm run build
```

This will create a `dist` directory with the optimized and minified application files.

### Linting

To check the code for any linting errors:

```bash
npm run lint
```

## Development Conventions

### Code Style

The project uses ESLint for code linting. The configuration is in the `eslint.config.js` file. The code style follows standard React and JSX conventions.

### Project Structure

The project has been refactored into a modular and organized structure:

- **`src/pages`**: Contains top-level page components. `EditorPage.jsx` is the main page that renders the editor.
- **`src/components/Editor`**: This directory contains all the components related to the email editor.
    - `index.jsx`: The main orchestrator for the editor, bringing together the toolbar, tabs, and modals.
    - `EditorToolbar.jsx`: The toolbar with tabs and action buttons.
    - `EditorTabs.jsx`: Manages the different views (Design, JSON, HTML, Plain Text).
    - `UnlayerEditor.jsx`: A wrapper around the `react-email-editor` with all its configurations.
    - `modals/`: Contains all modal dialog components (`ImportHtmlModal`, `ClearEditorModal`, `PreviewPanel`).
- **`src/hooks`**: Contains custom React hooks to encapsulate and reuse stateful logic.
    - `useEmailData.js`: Manages the state of the email data (design, JSON, HTML, etc.) and its synchronization with `localStorage`.
    - `useEmailEditor.js`: Manages the Unlayer editor instance, including loading, saving, undo/redo, and other editor-specific actions.
- **`src/utils`**: Contains utility functions. `emailUtils.js` handles the generation of email-safe HTML and plain text, and `htmlToUnlayer.js` handles the parsing of HTML into Unlayer's design format.
- **`src/styles`**: Contains global stylesheets.
- **`public`**: Contains static assets.

The entry point of the application is `src/main.jsx`, which renders the `EditorPage.jsx` component.
