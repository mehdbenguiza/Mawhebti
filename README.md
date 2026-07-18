# Mawhebti

Mawhebti est une plateforme intelligente de découverte de talents et de financement participatif.

## Prérequis

- Docker et Docker Compose
- Node.js (v20+)
- Python (3.11+)

## Démarrage rapide avec Docker (Recommandé)

1. Créez un fichier `.env` à la racine basé sur `.env.example` :
   ```bash
   cp .env.example .env
   ```

2. Lancez les conteneurs :
   ```bash
   docker-compose up -d --build
   ```

3. Accédez aux services :
   - Frontend : http://localhost:5173
   - Backend API : http://localhost:8000
   - Documentation API : http://localhost:8000/docs

## Développement local sans Docker

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Ou venv\Scripts\activate sur Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Structure du projet
- `backend/` : API FastAPI (Monolithe modulaire)
- `frontend/` : Application React avec TypeScript et Vite
