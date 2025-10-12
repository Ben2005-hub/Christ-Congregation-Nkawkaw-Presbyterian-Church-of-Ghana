
# Presbyterian Church of Ghana Web Application

This is a full-stack web application for managing church members, tithes, funeral dues, and sending SMS notifications.

## Features
- Member registration with SMS confirmation
- Payment of tithes and funeral dues with SMS receipt
- Admin dashboard (basic member and payment listing)
- Modern, responsive UI with church branding

## Tech Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- SMS: Twilio

## Setup

### 1. Backend
1. Copy `.env.example` to `.env` and fill in your Twilio credentials.
2. Install dependencies:
   ```bash
   cd server
   npm install
   ```
3. Start the backend:
   ```bash
   npm run dev
   ```

### 2. Frontend
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the frontend:
   ```bash
   npm run dev
   ```

The frontend runs on http://localhost:5173 and the backend on http://localhost:5000 by default.

## Customization
- Replace `src/assets/pcg-logo.png` with the official church logo for best results.
- For production, connect to a real database and secure admin features.

---

For questions or support, contact the project maintainer.


## Additional Information

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
