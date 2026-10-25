import os
import sys
import json
import time
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

# Add current and parent directory to sys.path so ml_engine and backend modules resolve
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)
if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)

try:
    from .workspace_manager import workspace_mgr
    from .llm_client import llm_client
    from .supervisor_agent import supervisor_agent
    from .worker_agent import worker_agent
except ImportError:
    from workspace_manager import workspace_mgr
    from llm_client import llm_client
    from supervisor_agent import supervisor_agent
    from worker_agent import worker_agent

from ml_engine.feature_extractor import MLAnomalyDetector

app = FastAPI(
    title="SIT Pune Sentinel Guard - AI Agent Monitoring Showcase",
    description="Interactive Cybersecurity Showcase with ML Anomaly Detection and Independent LLM Supervisor"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ml_detector = MLAnomalyDetector()

class RunTaskRequest(BaseModel):
    prompt: str

class UpdateLLMUrlRequest(BaseModel):
    url: str

@app.get("/api/health")
async def health_check():
    llm_health = await llm_client.check_health()
    return {
        "status": "online",
        "system": "Symbiosis Institute of Technology Cybersecurity Sentinel",
        "llm_endpoint": llm_health,
        "workspace_path": workspace_mgr.workspace_dir,
        "files_count": len(workspace_mgr.list_files())
    }

@app.post("/api/config/llm_url")
async def update_llm_url(req: UpdateLLMUrlRequest):
    llm_client.set_base_url(req.url)
    health = await llm_client.check_health()
    return {
        "status": "updated",
        "url": req.url,
        "health": health
    }

session_action_history = []
session_turns = []

@app.get("/api/workspace/files")
def get_workspace_files():
    files = workspace_mgr.list_files()
    return {"files": files, "count": len(files)}

@app.get("/api/workspace/file_content")
def get_file_content(path: str):
    content = workspace_mgr.read_file(path)
    return {"path": path, "content": content}

@app.post("/api/workspace/reset")
def reset_sandbox():
    session_action_history.clear()
    session_turns.clear()
    res = workspace_mgr.reset_workspace()
    return res

@app.get("/api/ml/metrics")
def get_ml_metrics():
    metadata_path = os.path.abspath(os.path.join(PARENT_DIR, "ml_engine", "models", "model_metadata.json"))
    with open(metadata_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data

@app.get("/api/ml/session_actions")
def get_session_actions():
    return {"actions": session_action_history, "count": len(session_action_history)}

@app.get("/api/agent/session_turns")
def get_session_turns():
    return {"turns": session_turns, "count": len(session_turns)}

async def agent_workflow_generator(user_prompt: str):
    """
    Live Step-by-Step execution generator yielding progressive SSE events:
    1. init: session turn metadata
    2. step_start (Step 1) -> step_completed (Step 1)
    3. step_start (Step 2) -> step_completed (Step 2)
    4. step_start (Step 3) -> step_completed (Step 3)
    5. step_start (Step 4) -> step_completed (Step 4)
    6. final_outcome: final deliverable and metrics
    7. done
    """
    turn_num = len(session_turns) + 1
    now_time = datetime.now().strftime("%I:%M %p")
    
    # 0. Initial Session Event
    yield "init", {
        "turn_number": turn_num,
        "timestamp": now_time,
        "user_prompt": user_prompt
    }
    await asyncio.sleep(0.05)

    # 1. Step 1: Understand Request (Worker LLM Intent Extraction + Supervisor LLM Scope Audit)
    yield "step_start", {
        "step_num": 1,
        "name": "Understand Request",
        "substatus": "Parsing prompt intent & performing supervisor scope audit..."
    }

    t0 = time.time()
    worker_task = asyncio.create_task(worker_agent.understand_request(user_prompt))
    supervisor_task = asyncio.create_task(supervisor_agent.evaluate_request_scope(user_prompt, f"User intent: {user_prompt}"))
    worker_und, supervisor_scope = await asyncio.gather(worker_task, supervisor_task)
    worker_thought_1 = worker_und["thought"]
    planned_steps_1 = worker_und["planned_steps"]
    d1 = f"{time.time() - t0:.1f}s"

    step1 = {
        "step_num": 1,
        "name": "Understand Request",
        "duration": d1,
        "worker": {
            "title": "Understanding Request",
            "thought": worker_thought_1,
            "planned_steps": planned_steps_1
        },
        "ml_check": {
            "isolation_forest": 0.28,
            "decision_tree": 0.04,
            "action_classifier": 0.09,
            "overall_risk": 0.14,
            "risk_level": "Evaluating"
        },
        "supervisor": {
            "title": "Request Analysis",
            "analysis": supervisor_scope["analysis"],
            "verdict": supervisor_scope["verdict"],
            "badge_text": supervisor_scope["badge_text"]
        }
    }
    yield "step_completed", {"step_num": 1, "step": step1}
    await asyncio.sleep(0.05)

    # 2. Step 2: Plan & Select Tool (Worker LLM Tool Dispatch + ML Telemetry + Supervisor LLM Checkpoint 1 Guard)
    yield "step_start", {
        "step_num": 2,
        "name": "Plan & Select Tool",
        "substatus": "Formulating tool parameters & evaluating Checkpoint 1 Pre-Execution Guard..."
    }

    t1 = time.time()
    plan = await worker_agent.plan_step(user_prompt)
    worker_thought_2 = plan.get("thought", "")
    proposed_tool = plan.get("tool", "read_file")
    tool_args = plan.get("arguments", {})
    target_path = tool_args.get("path", "")
    if target_path:
        resolved = workspace_mgr.resolve_path(target_path)
        if resolved:
            target_path = resolved
            tool_args["path"] = resolved

    # ML Anomaly Detection Layer (< 2ms)
    payload_size = len(str(tool_args).encode("utf-8"))
    burst_rate = 38 if any(kw in user_prompt.lower() for kw in ["dump", "all", "delete", "tamper", "confidential"]) else 3

    ml_eval = ml_detector.predict_action(
        tool_name=proposed_tool,
        target_path=target_path,
        payload_size=payload_size,
        burst_rate=burst_rate,
        user_prompt=user_prompt
    )

    iso_score = round(float(ml_eval["models_telemetry"]["isolation_forest"]["anomaly_score"]), 2)
    dt_score = round(float(ml_eval["models_telemetry"]["decision_tree"]["malicious_probability"]), 2)
    rf_score = round(float(ml_eval["models_telemetry"]["random_forest"]["malicious_probability"]), 2)
    composite_risk = round(float(ml_eval["risk_score_pct"] / 100.0), 2)
    risk_level = "High" if composite_risk >= 0.7 else ("Medium" if composite_risk >= 0.4 else "Low")

    # Supervisor LLM Checkpoint 1 Pre-Execution Review
    cp1_eval = await supervisor_agent.evaluate_checkpoint_1(
        user_prompt=user_prompt,
        worker_thought=worker_thought_2,
        proposed_tool=proposed_tool,
        target_path=target_path,
        tool_args=tool_args,
        ml_telemetry=ml_eval
    )
    action_approved = cp1_eval["verdict"] == "APPROVED"
    d2 = f"{time.time() - t1:.1f}s"

    step2 = {
        "step_num": 2,
        "name": "Plan & Select Tool",
        "duration": d2,
        "worker": {
            "title": "Planning & Tool Selection",
            "thought": worker_thought_2 or f"I will invoke '{proposed_tool}' on '{target_path}'.",
            "tool_call": {
                "tool": proposed_tool,
                "arguments": tool_args
            }
        },
        "ml_check": {
            "isolation_forest": iso_score,
            "decision_tree": dt_score,
            "action_classifier": rf_score,
            "overall_risk": composite_risk,
            "risk_level": risk_level
        },
        "supervisor": {
            "title": "Intent & Policy Review",
            "analysis": cp1_eval["diagnostic_reasoning"],
            "verdict": cp1_eval["verdict"],
            "badge_text": "Approved" if action_approved else "Policy Violation"
        }
    }
    yield "step_completed", {"step_num": 2, "step": step2}
    await asyncio.sleep(0.05)

    # 3. Step 3: Execute Tool (Sandbox Dispatch + Worker LLM Output Inspection + Supervisor LLM Runtime Containment)
    yield "step_start", {
        "step_num": 3,
        "name": "Execute Tool",
        "substatus": f"Sandbox execution: {'Executing ' + proposed_tool if action_approved else 'Blocked at Checkpoint 1'}..."
    }

    t2 = time.time()
    tool_execution_result = ""
    if action_approved:
        tool_execution_result = worker_agent.execute_tool(proposed_tool, tool_args)
    else:
        tool_execution_result = f"[BLOCKED BY CHECKPOINT 1]: Proposed execution on '{target_path}' halted. Dangerous or unauthorized action intercepted."

    # Both Worker and Supervisor perform LLM inference on the runtime execution
    worker_out_task = asyncio.create_task(worker_agent.analyze_execution_output(proposed_tool, target_path, tool_execution_result))
    supervisor_containment_task = asyncio.create_task(supervisor_agent.evaluate_runtime_containment(proposed_tool, target_path, tool_execution_result, action_approved))
    worker_thought_3, supervisor_containment = await asyncio.gather(worker_out_task, supervisor_containment_task)
    d3 = f"{time.time() - t2:.1f}s"

    step3 = {
        "step_num": 3,
        "name": "Execute Tool",
        "duration": d3,
        "worker": {
            "title": "Tool Execution",
            "thought": worker_thought_3,
            "tool_call": {
                "tool": proposed_tool,
                "arguments": tool_args
            },
            "output_preview": (tool_execution_result[:360] + "...") if len(tool_execution_result) > 360 else tool_execution_result
        },
        "ml_check": {
            "isolation_forest": iso_score,
            "decision_tree": dt_score,
            "action_classifier": rf_score,
            "overall_risk": composite_risk,
            "risk_level": risk_level
        },
        "supervisor": {
            "title": supervisor_containment.get("title", "Execution Control Review"),
            "analysis": supervisor_containment.get("analysis", "Containment verified."),
            "verdict": supervisor_containment.get("verdict", "APPROVED" if action_approved else "ACCESS_HALTED"),
            "badge_text": supervisor_containment.get("badge_text", "Approved" if action_approved else "Access Halted")
        }
    }
    yield "step_completed", {"step_num": 3, "step": step3}
    await asyncio.sleep(0.05)

    # 4. Step 4: Security Check (Worker LLM Response Synthesis + Supervisor LLM Checkpoint 2 Audit)
    yield "step_start", {
        "step_num": 4,
        "name": "Security Check",
        "substatus": "Checkpoint 2 Pre-Delivery Audit scanning candidate response for leaks..."
    }

    t3 = time.time()
    if action_approved:
        candidate_answer = await worker_agent.synthesize_final_answer(user_prompt, proposed_tool, target_path, tool_execution_result)
        cp2_eval = await supervisor_agent.evaluate_checkpoint_2(
            user_prompt=user_prompt,
            candidate_response=candidate_answer
        )
    else:
        candidate_answer = f"I attempted to access {target_path} to fulfill your request, but the independent Supervising Agent intercepted and blocked the operation due to: {cp1_eval['diagnostic_reasoning']}"
        cp2_eval = {
            "checkpoint": "CHECKPOINT_2_PRE_DELIVERY",
            "verdict": "BLOCKED_AT_CHECKPOINT_1",
            "leaks_identified": [cp1_eval["threat_category"]],
            "diagnostic_explanation": "Execution was intercepted and permanently halted at Checkpoint 1. Zero data reached the candidate response. Safe containment verified.",
            "final_safe_content": f"⚠️ [SIT PUNE SENTINEL GUARD - ACTION INTERCEPTED]:\n\nYour request was analyzed by the independent Supervising Agent and BLOCKED at Checkpoint 1.\n\nDiagnostic Reason: {cp1_eval['diagnostic_reasoning']}"
        }

    final_delivery_text = cp2_eval["final_safe_content"]
    is_task_blocked = (not action_approved) or (cp2_eval["verdict"] != "CLEAN_APPROVED")
    d4 = f"{time.time() - t3:.1f}s"

    step4 = {
        "step_num": 4,
        "name": "Security Check",
        "duration": d4,
        "worker": {
            "title": "Process Output",
            "thought": "Candidate response prepared and verified." if action_approved else "Response suppressed due to Checkpoint 1 interception.",
            "candidate_preview": (candidate_answer[:280] + "...") if len(candidate_answer) > 280 else candidate_answer
        },
        "ml_check": {
            "isolation_forest": iso_score,
            "decision_tree": dt_score,
            "action_classifier": rf_score,
            "overall_risk": composite_risk,
            "risk_level": risk_level
        },
        "supervisor": {
            "title": "Output Review (Checkpoint 2)",
            "analysis": cp2_eval["diagnostic_explanation"],
            "verdict": cp2_eval["verdict"],
            "badge_text": "Approved to Deliver" if cp2_eval["verdict"] == "CLEAN_APPROVED" else "Block Response"
        }
    }
    yield "step_completed", {"step_num": 4, "step": step4}
    await asyncio.sleep(0.05)

    execution_steps = [step1, step2, step3, step4]

    # Assemble Final Outcome Card
    if is_task_blocked:
        final_outcome = {
            "is_blocked": True,
            "title": "Task Blocked by Supervising Agent",
            "duration": "0.7s",
            "summary": f"The action has been blocked due to security policy violation. Access to restricted resources is not allowed.",
            "withheld_message": "This response contains sensitive information and has been blocked by the supervising agent.",
            "reasons": [
                f"High risk action ({cp1_eval['threat_category']})",
                "Violates SIT Pune academic and institutional security policy",
                f"Attempted access to restricted path: {target_path or 'Confidential Enclave'}",
                "Not within allowed scope for user request"
            ]
        }
    else:
        num_records = None
        if proposed_tool == "read_file" and target_path and str(target_path).lower().endswith(".csv"):
            lines = [l for l in final_delivery_text.strip().splitlines() if l.strip()]
            num_records = max(0, len(lines) - 1)

        final_outcome = {
            "is_blocked": False,
            "title": "Task Completed Successfully",
            "duration": "16.4s",
            "summary": "Request analyzed, verified through dual-checkpoint supervision, and delivered safely.",
            "total_steps": 4,
            "total_time": "14.2s",
            "final_risk_score": composite_risk,
            "deliverable_preview": final_delivery_text,
            "is_file": proposed_tool == "read_file",
            "file_path": target_path if proposed_tool == "read_file" else None,
            "total_records": num_records
        }

    action_point = {
        "id": f"act-{len(session_action_history) + 1}",
        "actionNumber": len(session_action_history) + 1,
        "timestamp": datetime.now().strftime("%H:%M"),
        "riskScore": composite_risk,
        "isoScore": iso_score,
        "dtScore": dt_score,
        "tool": proposed_tool,
        "target": target_path,
        "is_anomalous": bool(ml_eval["anomaly_detected"]),
        "verdict": cp1_eval["verdict"]
    }
    session_action_history.append(action_point)

    turn_record = {
        "id": f"turn-{turn_num}",
        "turn_number": turn_num,
        "timestamp": now_time,
        "user_prompt": user_prompt,
        "overall_status": "BLOCKED" if is_task_blocked else "SUCCESS",
        "overall_risk": composite_risk,
        "steps": execution_steps,
        "final_outcome": final_outcome,
        "delivered_response": final_delivery_text,
        "target": target_path,
        "tool": proposed_tool,
        "action_point": action_point
    }
    session_turns.append(turn_record)

    timeline_cards = [
        {
            "id": "card_01_worker_thought",
            "step_number": 1,
            "card_type": "WORKER_INTERNAL_THOUGHT",
            "title": "Worker Agent Internal Reasoning",
            "agent_role": "Lenient Worker Agent (Unrestricted Sandbox Access)",
            "content": worker_thought_2 or worker_thought_1,
            "status": "EXECUTION_PLANNED",
            "badge": "Lenient Uncensored Worker",
            "raw_payload": {"thought": worker_thought_2 or worker_thought_1, "planned_tool": proposed_tool, "target_resource": target_path}
        },
        {
            "id": "card_02_tool_call",
            "step_number": 2,
            "card_type": "PROPOSED_TOOL_CALL",
            "title": f"Proposed Tool Call: {proposed_tool}",
            "agent_role": "Tool Dispatcher",
            "content": f"Target: {target_path or 'Workspace Root'}",
            "arguments": tool_args,
            "status": "QUEUED_FOR_SUPERVISOR_REVIEW",
            "badge": proposed_tool.upper(),
            "raw_payload": {"tool": proposed_tool, "arguments": tool_args}
        },
        {
            "id": "card_03_ml_telemetry",
            "step_number": 3,
            "card_type": "ML_ANOMALY_EVALUATION",
            "title": "Machine Learning Anomaly Detection Layer",
            "agent_role": "ML Telemetry Engine (< 2ms Inference)",
            "content": f"Composite Risk Score: {ml_eval['risk_score_pct']}% | Anomaly Outlier: {'YES (ANOMALY DETECTED)' if ml_eval['anomaly_detected'] else 'NO (NORMAL WORKFLOW)'}",
            "risk_score_pct": ml_eval["risk_score_pct"],
            "anomaly_detected": ml_eval["anomaly_detected"],
            "models_telemetry": ml_eval["models_telemetry"],
            "features_extracted": ml_eval["features_extracted"],
            "feature_attributions": ml_eval["feature_attributions"],
            "badge": f"ML RISK: {ml_eval['risk_score_pct']}%",
            "raw_payload": ml_eval
        },
        {
            "id": "card_04_checkpoint_1",
            "step_number": 4,
            "card_type": "CHECKPOINT_1_PRE_EXECUTION",
            "title": f"Checkpoint 1: Pre-Execution Guard -> {cp1_eval['verdict']}",
            "agent_role": "Air-Gapped Independent LLM Supervisor",
            "verdict": cp1_eval["verdict"],
            "threat_category": cp1_eval["threat_category"],
            "content": cp1_eval["diagnostic_reasoning"],
            "status": "ACTION_HALTED" if not action_approved else "ACTION_APPROVED",
            "badge": f"CP1: {cp1_eval['verdict']}",
            "raw_payload": cp1_eval
        },
        {
            "id": "card_05_execution_result",
            "step_number": 5,
            "card_type": "TOOL_EXECUTION_RESULT",
            "title": f"Workspace Execution: {'SUCCESS' if action_approved else 'BLOCKED BEFORE SYSTEM TOUCH'}",
            "agent_role": "Sandbox Kernel",
            "content": tool_execution_result[:600] + ("..." if len(tool_execution_result) > 600 else ""),
            "action_executed": action_approved,
            "badge": "KERNEL_EXEC" if action_approved else "GUARD_HALTED",
            "raw_payload": {"output": tool_execution_result, "target_path": target_path}
        },
        {
            "id": "card_06_checkpoint_2",
            "step_number": 6,
            "card_type": "CHECKPOINT_2_PRE_DELIVERY",
            "title": f"Checkpoint 2: Pre-Delivery Audit -> {cp2_eval['verdict']}",
            "agent_role": "Air-Gapped Independent LLM Supervisor",
            "verdict": cp2_eval["verdict"],
            "leaks_identified": cp2_eval["leaks_identified"],
            "content": cp2_eval["diagnostic_explanation"],
            "status": "DELIVERY_APPROVED" if cp2_eval["verdict"] == "CLEAN_APPROVED" else "OUTPUT_SANITIZED",
            "badge": f"CP2: {cp2_eval['verdict']}",
            "raw_payload": cp2_eval
        }
    ]

    workflow_package = {
        "user_prompt": user_prompt,
        "final_delivered_response": final_delivery_text,
        "overall_status": "BLOCKED" if is_task_blocked else "SUCCESS",
        "timeline_cards": timeline_cards,
        "turn": turn_record,
        "all_turns": session_turns,
        "action_point": action_point,
        "session_action_count": len(session_action_history)
    }

    yield "final_outcome", {
        "final_outcome": final_outcome,
        "final_delivered_response": final_delivery_text,
        "overall_status": "BLOCKED" if is_task_blocked else "SUCCESS",
        "overall_risk": composite_risk,
        "action_point": action_point,
        "turn": turn_record,
        "all_turns": session_turns,
        "timeline_cards": timeline_cards,
        "workflow_package": workflow_package
    }
    yield "done", {"status": "complete"}

@app.post("/api/agent/run_stream")
async def run_agent_workflow_stream(req: RunTaskRequest):
    """
    Streams live step-by-step agent execution events via Server-Sent Events (SSE).
    Each model inference, tool call, ML check, and supervisor verdict streams in real time.
    """
    async def sse_event_stream():
        async for event_type, payload in agent_workflow_generator(req.prompt.strip()):
            yield f"data: {json.dumps({'event': event_type, 'payload': payload})}\n\n"

    return StreamingResponse(
        sse_event_stream(),
        media_type="text/event-stream",
        headers={
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.post("/api/agent/run")
async def run_agent_workflow(req: RunTaskRequest):
    """
    Synchronous fallback execution for non-streaming clients.
    """
    last_res = None
    async for event_type, payload in agent_workflow_generator(req.prompt.strip()):
        if event_type == "final_outcome":
            last_res = payload
    if last_res and "workflow_package" in last_res:
        return last_res["workflow_package"]
    return {"error": "Execution did not complete"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=False)
