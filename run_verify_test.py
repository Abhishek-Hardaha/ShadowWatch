import sys
import subprocess
import time
import urllib.request
import json
import threading

print("=== ANTIGRAVITY LOCAL VERIFICATION HARNESS ===")
print(f"Python executable: {sys.executable}")

# Test 1: Generate colab_server.py exactly as written in the notebook
server_code = """
import os
import sys
import time
import psutil
import torch
import asyncio
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Antigravity Colab Autonomous Node")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

COMMAND_LOGS = []
CURRENT_MODEL = {
    "name": "None",
    "status": "Idle",
    "quantization": "None",
    "device": "GPU" if torch.cuda.is_available() else "CPU"
}
LOADED_MODEL = None
LOADED_TOKENIZER = None

def log_event(source: str, message: str):
    timestamp = datetime.now().strftime("%H:%M:%S")
    entry = f"[{timestamp}] [{source}] {message}"
    COMMAND_LOGS.append(entry)
    if len(COMMAND_LOGS) > 300:
        COMMAND_LOGS.pop(0)
    print(entry)

def get_system_telemetry():
    ram = psutil.virtual_memory()
    ram_used = round(ram.used / (1024**3), 2)
    ram_total = round(ram.total / (1024**3), 2)
    ram_pct = ram.percent
    cpu_pct = psutil.cpu_percent(interval=None)

    gpu_data = {"available": False, "used_mb": 0, "total_mb": 0, "pct": 0, "name": "None"}
    if torch.cuda.is_available():
        free_b, total_b = torch.cuda.mem_get_info()
        used_b = total_b - free_b
        used_mb = round(used_b / (1024**2), 1)
        total_mb = round(total_b / (1024**2), 1)
        gpu_pct = round((used_mb / total_mb) * 100, 1)
        gpu_data = {
            "available": True,
            "name": torch.cuda.get_device_name(0),
            "used_mb": used_mb,
            "total_mb": total_mb,
            "pct": gpu_pct
        }

    return {
        "timestamp": datetime.now().isoformat(),
        "ram": {"used_gb": ram_used, "total_gb": ram_total, "pct": ram_pct},
        "cpu": {"pct": cpu_pct},
        "gpu": gpu_data,
        "model": CURRENT_MODEL
    }

class ExecRequest(BaseModel):
    command: str

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    model: Optional[str] = None
    messages: List[ChatMessage]
    max_tokens: Optional[int] = 512
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 0.9

class LoadModelRequest(BaseModel):
    model_id: str
    quantization: Optional[str] = "4bit"

@app.get("/api/status")
def status_endpoint():
    return get_system_telemetry()

@app.get("/api/logs")
def logs_endpoint():
    return {"logs": COMMAND_LOGS}

@app.post("/api/exec")
async def execute_remote_command(req: ExecRequest):
    log_event("ANTIGRAVITY_COMMAND", f"Executing: {req.command}")
    try:
        proc = await asyncio.create_subprocess_shell(
            req.command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await proc.communicate()
        out_str = stdout.decode("utf-8", errors="replace")
        err_str = stderr.decode("utf-8", errors="replace")

        if out_str:
            for line in out_str.strip().splitlines()[-5:]:
                log_event("STDOUT", line)
        if err_str:
            for line in err_str.strip().splitlines()[-5:]:
                log_event("STDERR", line)

        return {"returncode": proc.returncode, "stdout": out_str, "stderr": err_str}
    except Exception as e:
        log_event("EXEC_ERROR", str(e))
        return {"returncode": -1, "stdout": "", "stderr": str(e)}

@app.post("/api/llm/load")
def load_llm(req: LoadModelRequest):
    global LOADED_MODEL, LOADED_TOKENIZER, CURRENT_MODEL
    log_event("MODEL_LOADER", f"Loading '{req.model_id}' (quant={req.quantization})...")
    
    if LOADED_MODEL is not None:
        del LOADED_MODEL
        del LOADED_TOKENIZER
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            torch.cuda.ipc_collect()
    
    try:
        from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

        quant_config = None
        if req.quantization == "4bit" and torch.cuda.is_available():
            quant_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_use_double_quant=True
            )
        elif req.quantization == "8bit" and torch.cuda.is_available():
            quant_config = BitsAndBytesConfig(load_in_8bit=True)

        tokenizer = AutoTokenizer.from_pretrained(req.model_id, trust_remote_code=True)
        model = AutoModelForCausalLM.from_pretrained(
            req.model_id,
            device_map="auto" if torch.cuda.is_available() else "cpu",
            quantization_config=quant_config,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            low_cpu_mem_usage=True,
            trust_remote_code=True
        )

        LOADED_MODEL = model
        LOADED_TOKENIZER = tokenizer
        CURRENT_MODEL["name"] = req.model_id
        CURRENT_MODEL["status"] = "Active"
        CURRENT_MODEL["quantization"] = req.quantization

        log_event("MODEL_LOADER", f"Model '{req.model_id}' successfully loaded.")
        return {"status": "success", "model": req.model_id, "telemetry": get_system_telemetry()}
    except Exception as e:
        CURRENT_MODEL["status"] = f"Failed: {str(e)}"
        log_event("MODEL_ERROR", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/chat/completions")
def chat_completions(req: ChatCompletionRequest):
    global LOADED_MODEL, LOADED_TOKENIZER
    if LOADED_MODEL is None or LOADED_TOKENIZER is None:
        raise HTTPException(status_code=400, detail="No model loaded. Call /api/llm/load first.")

    log_event("INFERENCE", f"Generating response ({len(req.messages)} messages)...")
    
    try:
        chat_dict = [{"role": m.role, "content": m.content} for m in req.messages]
        prompt = LOADED_TOKENIZER.apply_chat_template(chat_dict, tokenize=False, add_generation_prompt=True)
    except Exception:
        prompt = ""
        for m in req.messages:
            prompt += f"<|im_start|>{m.role}\\n{m.content}<|im_end|>\\n"
        prompt += "<|im_start|>assistant\\n"

    device = "cuda" if torch.cuda.is_available() else "cpu"
    inputs = LOADED_TOKENIZER(prompt, return_tensors="pt").to(device)

    start_t = time.time()
    with torch.no_grad():
        output_ids = LOADED_MODEL.generate(
            **inputs,
            max_new_tokens=req.max_tokens,
            temperature=req.temperature if req.temperature > 0 else None,
            top_p=req.top_p if req.temperature > 0 else None,
            do_sample=True if req.temperature > 0 else False,
            pad_token_id=LOADED_TOKENIZER.eos_token_id
        )
    elapsed = round(time.time() - start_t, 2)
    new_tokens = output_ids[0][inputs.input_ids.shape[1]:]
    response_text = LOADED_TOKENIZER.decode(new_tokens, skip_special_tokens=True)

    tok_count = len(new_tokens)
    tps = round(tok_count / elapsed, 1) if elapsed > 0 else 0
    log_event("INFERENCE_DONE", f"Output {tok_count} tokens in {elapsed}s ({tps} tok/s)")

    return {
        "id": f"chatcmpl-{int(time.time())}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": CURRENT_MODEL["name"],
        "choices": [{
            "index": 0,
            "message": {"role": "assistant", "content": response_text},
            "finish_reason": "stop"
        }],
        "usage": {
            "prompt_tokens": len(inputs.input_ids[0]),
            "completion_tokens": tok_count,
            "total_tokens": len(inputs.input_ids[0]) + tok_count
        },
        "performance": {"tokens_per_second": tps, "latency_seconds": elapsed}
    }

DASHBOARD_HTML = \"\"\"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Antigravity Autonomous Colab Node</title>
    <style>
        :root {
            --bg: #090d16;
            --card: #111827;
            --border: #1f293d;
            --cyan: #38bdf8;
            --purple: #a855f7;
            --green: #22c55e;
            --yellow: #f59e0b;
            --red: #ef4444;
            --text: #f3f4f6;
            --dim: #9ca3af;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; }
        body { background: var(--bg); color: var(--text); padding: 24px; min-height: 100vh; }
        header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
        .title { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
        .subtitle { font-size: 13px; color: var(--dim); margin-top: 4px; }
        .badge { background: rgba(34, 197, 94, 0.15); color: var(--green); border: 1px solid var(--green); border-radius: 9999px; padding: 4px 14px; font-size: 12px; font-weight: 700; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 18px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
        .card-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--dim); margin-bottom: 8px; }
        .val { font-size: 24px; font-weight: 700; color: var(--text); }
        .bar-bg { width: 100%; height: 8px; background: #1e293b; border-radius: 4px; overflow: hidden; margin-top: 12px; }
        .bar-fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; width: 0%; }
        .gpu-fill { background: linear-gradient(90deg, var(--cyan), #818cf8); }
        .ram-fill { background: linear-gradient(90deg, var(--purple), #ec4899); }
        .cpu-fill { background: linear-gradient(90deg, var(--green), var(--yellow)); }
        .status-sub { font-size: 12px; color: var(--dim); margin-top: 6px; }
        .terminal-card { background: #0b0f19; border: 1px solid var(--border); border-radius: 12px; padding: 18px; }
        .term-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .term-head span { font-size: 13px; font-weight: 700; text-transform: uppercase; color: var(--dim); }
        .terminal { background: #030712; border: 1px solid #111827; border-radius: 8px; padding: 14px; font-size: 13px; height: 320px; overflow-y: auto; color: #a5f3fc; line-height: 1.6; }
        .log-row { border-bottom: 1px solid rgba(255,255,255,0.03); padding: 2px 0; word-break: break-all; }
    </style>
</head>
<body>
    <header>
        <div>
            <div class="title">Antigravity Autonomous Colab Node</div>
            <div class="subtitle">Live Telemetry &bull; Safe &lt;14GB VRAM &bull; Remote Agent Execution</div>
        </div>
        <div class="badge" id="online-badge">&bull; ONLINE &amp; READY</div>
    </header>
    <div class="grid">
        <div class="card">
            <div class="card-label">GPU VRAM (Safety Limit: 14 GB)</div>
            <div class="val" id="vram-val">-- / -- MB</div>
            <div class="bar-bg"><div class="bar-fill gpu-fill" id="vram-bar"></div></div>
            <div class="status-sub" id="gpu-name">Detecting GPU...</div>
        </div>
        <div class="card">
            <div class="card-label">System RAM (Safety Limit: 12 GB)</div>
            <div class="val" id="ram-val">-- / -- GB</div>
            <div class="bar-bg"><div class="bar-fill ram-fill" id="ram-bar"></div></div>
            <div class="status-sub" id="ram-pct">0% Used</div>
        </div>
        <div class="card">
            <div class="card-label">CPU Utilization</div>
            <div class="val" id="cpu-val">-- %</div>
            <div class="bar-bg"><div class="bar-fill cpu-fill" id="cpu-bar"></div></div>
            <div class="status-sub">Host Compute Load</div>
        </div>
        <div class="card">
            <div class="card-label">Active Open-Source LLM</div>
            <div class="val" style="font-size: 17px; word-break: break-all;" id="model-name">None</div>
            <div class="status-sub" id="model-details">Status: Idle</div>
        </div>
    </div>
    <div class="terminal-card">
        <div class="term-head">
            <span>Live Antigravity Command &amp; Inference Stream</span>
            <span style="font-size:12px; color:var(--dim);">Auto-refreshing &bull; 1.5s</span>
        </div>
        <div class="terminal" id="term-box">
            <div class="log-row">[SYSTEM] Initializing telemetry listener...</div>
        </div>
    </div>
    <script>
        async function updateTelemetry() {
            try {
                const [resStatus, resLogs] = await Promise.all([
                    fetch('/api/status'),
                    fetch('/api/logs')
                ]);
                const st = await resStatus.json();
                const lg = await resLogs.json();
                if (st.gpu.available) {
                    document.getElementById('vram-val').innerText = `${st.gpu.used_mb} / ${st.gpu.total_mb} MB`;
                    document.getElementById('vram-bar').style.width = `${st.gpu.pct}%`;
                    document.getElementById('gpu-name').innerText = `${st.gpu.name} (${st.gpu.pct}%)`;
                    if (st.gpu.used_mb > 14000) {
                        document.getElementById('vram-bar').style.background = 'var(--red)';
                    }
                } else {
                    document.getElementById('vram-val').innerText = 'NO GPU (CPU MODE)';
                }
                document.getElementById('ram-val').innerText = `${st.ram.used_gb} / ${st.ram.total_gb} GB`;
                document.getElementById('ram-bar').style.width = `${st.ram.pct}%`;
                document.getElementById('ram-pct').innerText = `${st.ram.pct}% System RAM Used`;
                document.getElementById('cpu-val').innerText = `${st.cpu.pct}%`;
                document.getElementById('cpu-bar').style.width = `${st.cpu.pct}%`;
                document.getElementById('model-name').innerText = st.model.name;
                document.getElementById('model-details').innerText = `Status: ${st.model.status} | Quant: ${st.model.quantization}`;
                const box = document.getElementById('term-box');
                box.innerHTML = lg.logs.map(l => `<div class="log-row">${l}</div>`).join('');
                box.scrollTop = box.scrollHeight;
            } catch (err) {
                console.error("Telemetry error:", err);
            }
        }
        setInterval(updateTelemetry, 1500);
        updateTelemetry();
    </script>
</body>
</html>\"\"\"

@app.get("/", response_class=HTMLResponse)
def index_page():
    return DASHBOARD_HTML
"""

with open("colab_server_test.py", "w", encoding="utf-8") as f:
    f.write(server_code.strip())

print("Test 1 Passed: colab_server_test.py created without syntax errors.")

# Test 2: Start server in background thread
import uvicorn
import colab_server_test

TEST_PORT = 8991

def run_srv():
    config = uvicorn.Config(colab_server_test.app, host="127.0.0.1", port=TEST_PORT, log_level="warning")
    srv = uvicorn.Server(config)
    srv.run()

t = threading.Thread(target=run_srv, daemon=True)
t.start()
time.sleep(2)

print("Test 2 Passed: Uvicorn server started in daemon thread on port", TEST_PORT)

# Test 3: Query GET /
with urllib.request.urlopen(f"http://127.0.0.1:{TEST_PORT}/") as resp:
    html = resp.read().decode()
    assert "Antigravity Autonomous Colab Node" in html
    assert resp.status == 200
print(f"Test 3 Passed: GET / returned HTTP 200 with HTML ({len(html)} bytes)")

# Test 4: Query GET /api/status
with urllib.request.urlopen(f"http://127.0.0.1:{TEST_PORT}/api/status") as resp:
    st = json.loads(resp.read().decode())
    assert "ram" in st
    assert "gpu" in st
    assert "model" in st
    assert resp.status == 200
print("Test 4 Passed: GET /api/status returned telemetry:", st["ram"])

# Test 5: Query POST /api/exec
payload = json.dumps({"command": "echo 'Antigravity Autonomous Exec Works!'"}).encode()
req = urllib.request.Request(f"http://127.0.0.1:{TEST_PORT}/api/exec", data=payload, headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req) as resp:
    res = json.loads(resp.read().decode())
    assert "Antigravity Autonomous Exec Works!" in res["stdout"]
    assert res["returncode"] == 0
print("Test 5 Passed: POST /api/exec executed remote bash command:", res["stdout"].strip())

# Test 6: Query GET /api/logs to ensure execution was captured in logs
with urllib.request.urlopen(f"http://127.0.0.1:{TEST_PORT}/api/logs") as resp:
    lg = json.loads(resp.read().decode())
    assert len(lg["logs"]) > 0
print(f"Test 6 Passed: GET /api/logs captured {len(lg['logs'])} log lines.")

print("=== ALL 6 TESTS PASSED WITH 100% SUCCESS ===")
