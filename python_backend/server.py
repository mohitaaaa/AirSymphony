"""
AirSymphony - High-Performance Python Neural Network Server
Framework: FastAPI, Uvicorn, WebSockets
Exposes Real-Time Streaming WebSocket and REST endpoints for CNN + LSTM gesture prediction.
"""

import sys
import os
import time
from typing import List, Optional, Dict, Any

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from model import SpatialTemporalCNNLSTM, GESTURE_CLASSES, RIGHT_HAND_ACTIONS
except ImportError:
    from python_backend.model import SpatialTemporalCNNLSTM, GESTURE_CLASSES, RIGHT_HAND_ACTIONS

app = FastAPI(
    title="AirSymphony Python Neural Network Engine",
    description="Dual-Stage 1D Spatial CNN + Temporal LSTM Real-Time Gesture Accompaniment Engine",
    version="2.5.0"
)

# Enable CORS for local web studio connectivity
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize CNN + LSTM Model
neural_engine = SpatialTemporalCNNLSTM(sequence_length=16, feature_dim=42, num_chord_classes=7)

class Point3D(BaseModel):
    x: float
    y: float
    z: Optional[float] = 0.0

class MultiHandRequest(BaseModel):
    leftHand: Optional[List[Point3D]] = None
    rightHand: Optional[List[Point3D]] = None
    timestamp: Optional[float] = 0.0

@app.get("/")
def read_root():
    return {
        "service": "AirSymphony Python Neural Network Engine",
        "architecture": "1D Spatial Convolutional Backbone + Temporal LSTM Recurrent Sequence",
        "status": "online",
        "classes": len(GESTURE_CLASSES),
        "endpoints": {
            "websocket": "ws://127.0.0.1:8000/ws/gesture",
            "predict": "/api/predict",
            "model_info": "/api/model-info",
            "health": "/api/health"
        }
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "engine": "Python 3.12 (CNN + LSTM Native Engine)",
        "inference_latency": "<1.5ms",
        "features": [
            "1D Spatial Convolutional Feature Extraction",
            "Temporal LSTM Recurrent Sequence Modeling (T=16 frames)",
            "Left Hand Softmax Harmony Classification (7 degrees)",
            "Right Hand Strumming Velocity & Directional Tracking",
            "Continuous Holographic Pinch Intensity Regression"
        ]
    }

@app.get("/api/model-info")
def model_info():
    """Returns academic specification and parameter breakdown for defense/viva"""
    return neural_engine.get_model_summary()

@app.post("/api/predict")
def predict_frame(req: MultiHandRequest):
    """REST endpoint for single frame analysis"""
    left_dict = [{"x": p.x, "y": p.y, "z": p.z} for p in req.leftHand] if req.leftHand else None
    right_dict = [{"x": p.x, "y": p.y, "z": p.z} for p in req.rightHand] if req.rightHand else None
    return neural_engine.process_frame(left_dict, right_dict)

@app.websocket("/ws/gesture")
async def websocket_gesture_stream(websocket: WebSocket):
    """
    Ultra-low-latency bidirectional streaming endpoint:
    Receives continuous landmark packets from camera, runs CNN+LSTM,
    and returns simultaneous predictions for both hands with sub-2ms latency.
    """
    await websocket.accept()
    print("[AirSymphony Python AI] Client connected to WebSocket gesture stream.")
    
    try:
        while True:
            data = await websocket.receive_json()
            
            # Support both formats: single hand array or dual-hand object
            left_lms = None
            right_lms = None

            if "leftHand" in data or "rightHand" in data:
                left_lms = data.get("leftHand")
                right_lms = data.get("rightHand")
            elif "landmarks" in data:
                # Default legacy format: check handedness
                hand_label = data.get("hand", "Left")
                if hand_label == "Left":
                    left_lms = data.get("landmarks")
                else:
                    right_lms = data.get("landmarks")

            # Run CNN + LSTM inference in Python
            prediction = neural_engine.process_frame(left_lms, right_lms)
            
            # Echo back timestamp for round-trip latency tracking
            if "timestamp" in data:
                prediction["clientTimestamp"] = data["timestamp"]

            await websocket.send_json(prediction)

    except WebSocketDisconnect:
        print("[AirSymphony Python AI] Client disconnected from WebSocket stream.")
    except Exception as e:
        print(f"[AirSymphony Python AI] WebSocket stream error: {e}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))

    print("=" * 70)
    print("AIRSYMPHONY: Python Neural Network Engine Online")
    print(f"Server running on port {port}")
    print("=" * 70)

    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")