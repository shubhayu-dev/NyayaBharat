# NyayaBharat Frontend

This is a minimal React frontend (Vite) for the NyayaBharat FastAPI backend.

Quick start:

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Run dev server:

```bash
npm run dev
```

Make sure the backend is running (from project root):

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

The frontend expects the API at `http://127.0.0.1:8000`. To change, set `VITE_API_BASE` in your environment when running Vite.
