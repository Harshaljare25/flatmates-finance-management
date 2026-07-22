# FAUS // Flatmates Finance Management System

A high-fidelity, interactive **Flatmate Finance Management System** styled in the iconic **Bauhaus Design Aesthetic** (bold primary colors, geometric structures, solid black borders, hard offset shadows, and clean sans-serif typography).

The project is structured with a separate **Frontend Client** and **Backend Server**.

---

## 📂 Project Structure

```
c:/Users/Harshal/OneDrive/Desktop/Finance Management/
├── frontend/         # Frontend single-page client
│   ├── index.html
│   ├── style.css
│   └── js/
│       ├── app.js
│       ├── state.js
│       └── charts.js
└── backend/          # FastAPI Python Server
    ├── main.py       # API endpoints & server config
    └── data.json     # JSON database (Auto-generated on run)
```

---

## ⚙️ How it Works (Optional Backend Sync)

The application implements a hybrid persistence model:
1. **Offline/Static Mode**: If hosted statically (Vercel, Netlify, Github Pages) without a running backend, it works perfectly by saving all entries instantly to the browser's `localStorage`.
2. **Online/Connected Mode**: If the Python backend is running on `http://localhost:8000`, the frontend client automatically connects to it, merges the remote database entries, and pushes all updates to the backend in real-time.

---

## 💻 Running the Application

### 1. Start the Backend (API Server)
Ensure you have Python installed, then install dependencies and run uvicorn:
```bash
pip install fastapi uvicorn pydantic
cd backend
python main.py
```
The server will start on `http://127.0.0.1:8000` and create `data.json` if it doesn't exist.

### 2. Start the Frontend (Client)
You can open `frontend/index.html` directly in a browser (double-click) or run a simple local web server:
```bash
npm install -g http-server
cd frontend
http-server -p 5500
```
Open `http://localhost:5500` to access the interface.

---

## 🌐 Live Deployment

### Frontend (Client)
The `frontend/` folder can be hosted for free on Vercel, Netlify, or GitHub Pages. 
*   **Vercel**: Run `vercel` inside the `frontend` folder.
*   **Netlify**: Drag and drop the `frontend` folder into the Netlify dashboard.

### Backend (Server)
The `backend/` folder can be hosted on Render, Railway, or Fly.io (where Python is supported). Update the URL in `frontend/js/state.js` if you host the backend on a remote domain.
# flatmates-finance-management
