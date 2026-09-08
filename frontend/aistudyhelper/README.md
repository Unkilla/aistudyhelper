# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Deploy To Vercel

Create a separate Vercel project with the repository root set to `frontend/aistudyhelper`. The included `vercel.json` builds the Vite app and sends client-side routes to `index.html`.

Set this frontend project environment variable in Vercel:

- `VITE_BACKEND_DOMAIN`: the deployed backend URL, for example `https://your-api.vercel.app`.

The frontend deployment URL must also be configured as `FRONTEND_DOMAIN` in the backend Vercel project so API CORS permits browser requests.
