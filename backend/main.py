from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import os

app = FastAPI(title="FAUS Flatmates Finance API", version="1.0")

# Enable CORS for local static frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = os.path.join(os.path.dirname(__file__), "data.json")

# Pydantic schemas for verification
class AppState(BaseModel):
    flatmates: List[str]
    expenses: List[Dict[str, Any]]
    bills: List[Dict[str, Any]]
    settlements: List[Dict[str, Any]]

# Default state template
DEFAULT_STATE = {
    "flatmates": [
        "Harshal Jare",
        "Krushna Sakhare",
        "Shaswat Patil",
        "Vedant Bhusari",
        "Abhishek Jambhe"
    ],
    "expenses": [],
    "bills": [],
    "settlements": []
}

def load_data() -> Dict[str, Any]:
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, "w") as f:
            json.dump(DEFAULT_STATE, f, indent=4)
        return DEFAULT_STATE
    try:
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return DEFAULT_STATE

def save_data(data: Dict[str, Any]):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)

@app.get("/")
def read_root():
    return {"status": "online", "system": "FAUS Finance Backend"}

@app.get("/api/state")
def get_state():
    """Retrieve full app state data"""
    return load_data()

@app.post("/api/state")
def post_state(state: AppState):
    """Save full app state data"""
    try:
        save_data(state.dict())
        return {"success": True, "message": "State data saved successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Run uvicorn on port 8000
    uvicorn.run(app, host="127.0.0.1", port=8000)
