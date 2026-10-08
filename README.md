# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


# Custom Details
## How this project runs
1. React Front End - Basic page using Open Street Maps (OSM) for the map with Leaflet for map points and popups.
2. Express Back End - Upload json endpoint, Multiple get endpoints for the visits, activities and timeline/travel endpoints, with filters available.
3. SQLite3 - A local database which is created on the first run, and is interfaced with by Express.

## Running this program
Currently only tested in a development capacity - using npm run dev.
Further tests will need to be made before confirming that building it is stable.
### IMPORTANT NOTE
No user or input validation has been implemented as this is a local only functionality project rather than a secure hardened system.
### Pre-requisites
* NPM installed
### Steps
Terminal in Root directory of project.\
Install Node Packages - ```npm install``` - Installs necessary packages for system to run\
Run React - Dev mode - ```npm run dev``` - Front end / Webpage sends requests to the API\
Run Express - ```node ./server.js``` - The API, which creates and handles communication to database\
