import uvicorn
import sys
from pathlib import Path

# This ensures the 'app' directory is in the Python path
# so imports like 'from app.main import app' work correctly
path_root = Path(__file__).parents[0]
sys.path.append(str(path_root))

def start_server():
    """
    Entry point to run the FastAPI backend.
    """
    print("--- Network Traffic Monitoring Platform ---")
    print("Initializing Backend Server...")
    
    # We use 'app.main:app' because:
    # 'app' is the folder
    # 'main' is the file main.py
    # 'app' is the FastAPI variable inside main.py
    # Uvicorn is ASGI server that we use to run the FastAPI framework
    uvicorn.run(
        "app.main:app", 
        host="127.0.0.1", 
        port=8000, 
        reload=True,      # Auto-restarts server on code changes
        log_level="info"
    )

if __name__ == "__main__":
    try:
        start_server()
    except KeyboardInterrupt:
        print("\nServer stopped by user.")
        sys.exit(0)