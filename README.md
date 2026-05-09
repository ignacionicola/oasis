# 🏝️ Oasis Finance — Gestor de Gastos Personal

**Un gestor de gastos ultra-simple diseñado para personas que quieren dejar el papel y la calculadora.**

## Arquitectura

```
oasis-finance/
├── backend/              # Python + FastAPI
│   ├── app/
│   │   ├── main.py          # Entry point
│   │   ├── database.py      # SQLite setup
│   │   ├── models/          # SQLAlchemy models
│   │   ├── routes/          # API endpoints
│   │   ├── agents/          # AI Agents
│   │   │   ├── input_agent.py      # Normaliza entradas (voz, OCR, manual)
│   │   │   └── analysis_agent.py   # Categorización + duplicados + alertas
│   │   ├── skills/          # Skills de cada agente
│   │   │   ├── categorizer.py      # Categorización con Claude API
│   │   │   ├── duplicate_detector.py
│   │   │   └── budget_alert.py
│   │   └── utils/
│   │       └── normalizer.py       # Data Normalizer
│   └── requirements.txt
├── frontend/             # React Native (Expo)
│   └── (se genera con npx create-expo-app)
└── README.md
```

## Fase 1 — MVP (lo que estamos construyendo ahora)

- ✅ UI básica en React Native (Expo)
- ✅ Input manual de gastos (formulario rápido)
- ✅ Categorización automática con Claude API
- ✅ Dashboard con resumen del mes
- ✅ Detección de duplicados
- ✅ Alertas de presupuesto
- ✅ SQLite local para persistencia

## Setup rápido

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configurar tu API key de Anthropic
cp .env.example .env
# Editar .env con tu ANTHROPIC_API_KEY

# Correr el servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npx expo start
```

## Stack

| Componente | Tecnología |
|-----------|-----------|
| Frontend | React Native + Expo |
| Backend | Python + FastAPI |
| Base de datos | SQLite (local) |
| AI Categorización | Claude API (Sonnet) |
| AI Voz (Fase 2) | Whisper API |
| AI OCR (Fase 2) | Google Vision |
