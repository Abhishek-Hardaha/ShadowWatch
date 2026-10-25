# 🛡️ SIT Workspace Agent
### Autonomous Academic Multi-Agent Surveillance & ML Anomaly Sentinel

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.4-F7931E?logo=scikit-learn)](https://scikit-learn.org/)
[![PyTorch / Qwen2.5](https://img.shields.io/badge/LLM-Qwen2.5--14B--Instruct-blueviolet)](https://huggingface.co/Qwen)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **SIT Workspace Agent** is a dual-checkpoint multi-agent security and intelligence platform built for institutional and academic environments (demonstrated on Symbiosis Institute of Technology, SIT Pune). It provides real-time interception against pretexting, multi-turn prompt injection, data exfiltration, and unauthorized privilege escalation.

---

## 🏛️ System Architecture

```
                       ┌──────────────────────────────────────────────┐
                       │          User / Security Researcher          │
                       └──────────────────────┬───────────────────────┘
                                              │ Query / Test Prompt
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │   Worker Agent (Autonomous Tool Execution)   │
                       │   - Formulates plan & multi-step thoughts   │
                       │   - Proposes actions: read_file, search, etc │
                       └──────────────────────┬───────────────────────┘
                                              │ Action Proposal & Payload
                                              ▼
                        ══════════════════════════════════════════════
                         🛡️ DUAL-CHECKPOINT SECURITY SURVEILLANCE
                        ══════════════════════════════════════════════
                       ┌──────────────────────────────────────────────┐
                       │   CHECKPOINT 1: ML Anomaly Detection Radar   │
                       │   - 14 real security datasets (zero-synthetic)│
                       │   - Isolation Forest (<2ms anomaly score)    │
                       │   - Decision Tree (supervised threat score)  │
                       │   - Random Forest (action-risk classifier)   │
                       └──────────────────────┬───────────────────────┘
                                              │ Feature Attributions & Risk Vector
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │  CHECKPOINT 2: Sovereign LLM Supervisor Agent │
                       │  - Verifies multi-turn pretexting & intent   │
                       │  - Enforces FERPA, GDPR & campus security    │
                       │  - Sovereign VETO: APPROVED or BLOCKED       │
                       └──────────────────────┬───────────────────────┘
                                              │
                       ┌──────────────────────┴───────────────────────┐
                       │                                              │
               [CLEAN APPROVED]                              [THREAT BLOCKED]
                       │                                              │
                       ▼                                              ▼
         Executes against Sandbox Workspace             Redacts Data & Alerts Security
         (140 authentic academic files)                 (Provides Explainable Audit Trail)
```

---

## ⚡ Key Highlights & Features

- **Zero-Synthetic ML Engine:** Trained on 14+ authentic cybersecurity datasets (SecLists LFI, PayloadsAllTheThings privesc, Deepset Prompt Injections, Glaive Function Calling, CodeFeedback, Text-to-SQL).
- **Dual-Checkpoint Verification:**
  - **Checkpoint 1 (Pre-Execution ML):** Sub-millisecond feature extraction and anomaly scoring.
  - **Checkpoint 2 (Supervisory LLM):** Sovereign veto power over candidate outputs and tools.
- **Obsidian Liquid Glass Dashboard:**
  - Built with Next.js, featuring black and obsidian charcoal palettes (`#050507`), specular top reflections, and high-contrast cyber neon borders.
  - Real-time AI processing scanner with horizontal laser sweep line (`@keyframes aiScanline`) and token shimmer waves.
- **Authentic Campus Sandbox:** 140 institutional files covering syllabi, embargoed exam papers, student marks, financial records, and system files.
- **Full Deliverable CSV & File Rendering:** Displays complete tabular data without pagination truncation, with instant CSV download and verbatim inspector.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+** (Python 3.11 or 3.12 recommended)
- **Node.js 18+** and npm
- Optional: CUDA-enabled GPU (or free Google Colab notebook for the 14B LLM endpoint)

---

### 1. Clone the Repository
```bash
git clone https://github.com/Abhishek-Hardaha/Timer.git
cd Timer
```

---

### 2. Backend Setup
```bash
# Navigate to backend and install requirements
pip install fastapi uvicorn scikit-learn joblib numpy pydantic httpx requests

# (Optional) Retrain or verify ML models
python -m ml_engine.train_models

# Start the Sentinel Backend Daemon on port 8008
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8008
```

---

### 3. Frontend Setup
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start Next.js development server on port 3005
npm run dev -- -p 3005
```

Open [http://localhost:3005](http://localhost:3005) in your browser.

---

### 4. Connect Inference Server (Google Colab / Local vLLM)
1. Open the included notebook: `LLM_Server_API_Colab.ipynb` in [Google Colab](https://colab.research.google.com/).
2. Run all cells to spin up a GPU-accelerated **Qwen2.5-14B-Instruct** instance via `pyngrok` or local tunnel.
3. Click **Configure Inference Endpoint** in the header on `http://localhost:3005`, paste your tunnel URL, and save.

---

## 📁 Repository Structure

```
.
├── backend/                  # FastAPI Sentinel backend & agent coordinator
│   ├── app.py                # Main REST API endpoints & streaming agent runner
│   └── agent_supervisor.py   # Multi-agent dual checkpoint pipeline
├── ml_engine/                # Machine learning anomaly models & feature extractor
│   ├── feature_extractor.py  # 12-dimension behavioral feature extractor
│   ├── train_models.py       # Multi-model training script
│   └── models/               # Serialized models (.joblib) & metadata
├── frontend/                 # Next.js 14 obsidian liquid glass dashboard
│   ├── src/app/              # Next.js App Router (page.tsx, globals.css)
│   └── src/components/       # Modular UI components (Chat, Timeline, Radar, Modals)
├── sandbox_workspace/        # 140 authentic academic files (SIT Pune sandbox)
├── Datasets/                 # 14 authentic security & task callsets
├── LLM_Server_API_Colab.ipynb# Colab GPU LLM inference server notebook
└── README.md
```

---

## 🔒 Security & Privacy Notice
All files in `sandbox_workspace/` are structured for security research, evaluation, and educational demonstration within controlled environments.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
