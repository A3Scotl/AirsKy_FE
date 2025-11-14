# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

## 📁 Project Structure (Cấu trúc thư mục)

```
AirsKy_FE/
├── public/                  # Static assets (images, icons, etc.)
├── src/                     # Main source code
│   ├── apis/                # API handler modules for backend endpoints
│   ├── assets/              # Static assets used in React (SVG, images)
│   ├── components/          # Reusable React components
│   │   ├── auth/            # Auth-related components (login, register, etc.)
│   │   ├── common/          # Common UI widgets (search, cards, etc.)
│   │   ├── section/         # Page sections (profile, home, blog, etc.)
│   │   ├── admin/           # Admin dashboard components
│   │   └── ui/              # UI primitives (Button, Input, etc.)
│   ├── contexts/            # React context providers (auth, theme, search)
│   ├── hooks/               # Custom React hooks (use-user-profile, etc.)
│   ├── layouts/             # Layout components (admin, auth, public)
│   ├── lib/                 # Utility libraries (Stepper, etc.)
│   ├── pages/               # Page-level components (public, private, loading)
│   ├── routes/              # Route definitions (admin-route, etc.)
│   ├── services/            # Service modules for business logic
│   ├── styles/              # CSS files (custom calendar, swiper, etc.)
│   └── utils/               # Utility functions (api-handler, axios-instance, etc.)
├── .env                     # Environment variables
├── .gitignore               # Git ignore rules
├── package.json             # Project dependencies and scripts
├── vite.config.js           # Vite build configuration
├── jsconfig.json            # JS/TS project config
└── README.md                # Project documentation (this file)
```

> Bạn có thể bổ sung chi tiết từng thư mục/file theo nhu cầu phát triển!
