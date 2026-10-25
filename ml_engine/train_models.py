import os
import glob
import json
import math
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, accuracy_score, precision_score, recall_score, f1_score
from sklearn.preprocessing import StandardScaler
import joblib

DATASETS_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Datasets"))
REAL_DIR = os.path.join(DATASETS_ROOT, "Real dataset")
MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "models"))
os.makedirs(MODELS_DIR, exist_ok=True)

OP_TYPE_MAP = {
    "READ": 0,
    "SEARCH": 1,
    "WRITE": 2,
    "SQL": 3,
    "EXPORT": 4,
    "DELETE": 5,
    "EXEC": 6
}

SUSPICIOUS_TOKENS = [
    "select", "union", "drop", "update", "delete", "insert",
    "passwd", "shadow", "sudo", "chmod", "curl", "wget", "bash", "sh",
    "exec", "base64", "token", "secret", "password", "key", "confidential",
    "answer", "dump", "exfil", "exploit", "override", "root", "jailbreak",
    "dan", "bypass", "ignore", "prompt", "instructions", "system", "payload",
    "backdoor", "eval", "cat", "whoami", "nc", "netcat", "suid"
]

def shannon_entropy(text: str) -> float:
    if not text:
        return 0.0
    text_str = str(text)
    prob = [float(text_str.count(c)) / len(text_str) for c in dict.fromkeys(list(text_str))]
    entropy = -sum([p * math.log2(p) for p in prob if p > 0])
    return round(float(entropy), 3)

def count_suspicious_tokens(text: str) -> int:
    t = str(text).lower()
    return sum(1 for tok in SUSPICIOUS_TOKENS if tok in t)

def compute_path_sensitivity(path: str) -> float:
    p = str(path).lower()
    score = 0.0
    if any(k in p for k in ["../", "..\\", "etc/shadow", "etc/passwd", "root/"]):
        score += 0.90
    if any(k in p for k in ["confidential", "answerkey", "moderation", "question_papers", "endsem"]):
        score += 0.85
    if any(k in p for k in [".env", "sqlite", "password", "secret", "credentials", "auth", "server_access_audit_log", "ssh_host"]):
        score += 0.80
    if any(k in p for k in ["payroll", "salary", "marks", "disciplinary", "tuition_fee_defaults"]):
        score += 0.65
    if any(k in p for k in [".sh", ".py", ".conf", "nginx", "shell", "privesc", "backdoor", "firewall"]):
        score += 0.55
    return min(1.0, score)

FEATURE_NAMES = [
    "op_type_code",
    "path_sensitivity",
    "payload_size_log",
    "burst_frequency",
    "prompt_entropy",
    "suspicious_token_count",
    "is_destructive",
    "path_depth"
]

def extract_features(row):
    op = OP_TYPE_MAP.get(str(row.get("operation_type", "READ")).upper(), 0)
    target_path = str(row.get("target_path", ""))
    path_sens = compute_path_sensitivity(target_path)
    
    bytes_val = float(row.get("payload_size_bytes", 500))
    log_bytes = np.log1p(max(1.0, bytes_val))
    burst = float(row.get("burst_frequency_per_min", 2))
    prompt = str(row.get("user_prompt", ""))
    entropy = shannon_entropy(prompt)
    sus_count = count_suspicious_tokens(prompt)
    destr = int(row.get("is_destructive_action", 0))
    path_depth = target_path.count("/") + target_path.count("\\")
    
    return [
        float(op),
        float(path_sens),
        float(log_bytes),
        float(burst),
        float(entropy),
        float(sus_count),
        float(destr),
        float(path_depth)
    ]

def load_all_datasets():
    real_files = sorted(glob.glob(os.path.join(REAL_DIR, "*.jsonl")))
    records = []
    dataset_breakdown = {}
    for f in real_files:
        name = os.path.basename(f)
        count = 0
        with open(f, "r", encoding="utf-8") as fp:
            for line in fp:
                if line.strip():
                    item = json.loads(line)
                    item["dataset_source_type"] = "Real dataset"
                    records.append(item)
                    count += 1
        dataset_breakdown[name] = count
    df = pd.DataFrame(records)
    return df, dataset_breakdown

def train_robust_ml_models():
    print("=" * 75)
    print("ROBUST RETRAINING OF ML MODELS ON 100% REAL OPEN-SOURCE DATASETS")
    print("=" * 75)
    
    df, breakdown = load_all_datasets()
    print(f"Total Authentic Samples Loaded: {len(df):,}")
    print(f"  - Real Dataset Streams:      {len(breakdown)} files")
    print(f"  - Benign Workflows (label=0): {sum(df['label']==0):,} ({sum(df['label']==0)/len(df)*100:.1f}%)")
    print(f"  - Malicious Attacks (label=1): {sum(df['label']==1):,} ({sum(df['label']==1)/len(df)*100:.1f}%)")
    print(f"  - Synthetic Samples:         0 (Strictly Zero)")

    # Extract clean feature matrix
    X = np.array([extract_features(row) for _, row in df.iterrows()])
    y = df["label"].values.astype(int)

    # =========================================================================
    # EXPLICIT STRATIFIED TRAIN / TEST SPLIT (80% Train, 20% Held-Out Test)
    # Zero data leakage: test set never seen during training or scaling
    # =========================================================================
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    print(f"\nStratified Dataset Split:")
    print(f"  - Training Set (80%): {len(X_train):,} samples (Benign: {sum(y_train==0)}, Malicious: {sum(y_train==1)})")
    print(f"  - Held-Out Test (20%): {len(X_test):,} samples (Benign: {sum(y_test==0)}, Malicious: {sum(y_test==1)})")

    # Standard Scaler fitted ONLY on X_train (Zero Data Leakage)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # -------------------------------------------------------------------------
    # 1. Regularized Decision Tree (CART)
    # -------------------------------------------------------------------------
    dt = DecisionTreeClassifier(
        max_depth=5,
        min_samples_split=20,
        min_samples_leaf=10,
        ccp_alpha=0.001,
        random_state=42
    )
    dt.fit(X_train, y_train)

    # Train Metrics
    y_pred_dt_train = dt.predict(X_train)
    y_prob_dt_train = dt.predict_proba(X_train)[:, 1]
    train_acc_dt = accuracy_score(y_train, y_pred_dt_train)
    train_roc_dt = roc_auc_score(y_train, y_prob_dt_train)

    # Test Metrics (Held-Out)
    y_pred_dt_test = dt.predict(X_test)
    y_prob_dt_test = dt.predict_proba(X_test)[:, 1]
    test_acc_dt = accuracy_score(y_test, y_pred_dt_test)
    test_roc_dt = roc_auc_score(y_test, y_prob_dt_test)
    test_prec_dt = precision_score(y_test, y_pred_dt_test)
    test_rec_dt = recall_score(y_test, y_pred_dt_test)
    test_f1_dt = f1_score(y_test, y_pred_dt_test)
    cm_dt = confusion_matrix(y_test, y_pred_dt_test).tolist()

    print("\n[1. REGULARIZED DECISION TREE EVALUATION]")
    print(f"  Train Accuracy: {train_acc_dt*100:.2f}% | Train ROC-AUC: {train_roc_dt:.4f}")
    print(f"  Test Accuracy:  {test_acc_dt*100:.2f}% | Test ROC-AUC:  {test_roc_dt:.4f}")
    print(f"  Generalization Gap (Train - Test): {(train_acc_dt - test_acc_dt)*100:.2f}%")
    print(f"  Test Precision: {test_prec_dt*100:.2f}% | Test Recall: {test_rec_dt*100:.2f}% | Test F1: {test_f1_dt*100:.2f}%")

    # -------------------------------------------------------------------------
    # 2. Regularized Random Forest Ensemble (150 Trees)
    # -------------------------------------------------------------------------
    rf = RandomForestClassifier(
        n_estimators=150,
        max_depth=6,
        min_samples_split=15,
        min_samples_leaf=6,
        max_features="sqrt",
        random_state=42
    )
    rf.fit(X_train, y_train)

    # Train Metrics
    y_pred_rf_train = rf.predict(X_train)
    y_prob_rf_train = rf.predict_proba(X_train)[:, 1]
    train_acc_rf = accuracy_score(y_train, y_pred_rf_train)
    train_roc_rf = roc_auc_score(y_train, y_prob_rf_train)

    # Test Metrics (Held-Out)
    y_pred_rf_test = rf.predict(X_test)
    y_prob_rf_test = rf.predict_proba(X_test)[:, 1]
    test_acc_rf = accuracy_score(y_test, y_pred_rf_test)
    test_roc_rf = roc_auc_score(y_test, y_prob_rf_test)
    test_prec_rf = precision_score(y_test, y_pred_rf_test)
    test_rec_rf = recall_score(y_test, y_pred_rf_test)
    test_f1_rf = f1_score(y_test, y_pred_rf_test)
    cm_rf = confusion_matrix(y_test, y_pred_rf_test).tolist()

    print("\n[2. REGULARIZED RANDOM FOREST ENSEMBLE EVALUATION]")
    print(f"  Train Accuracy: {train_acc_rf*100:.2f}% | Train ROC-AUC: {train_roc_rf:.4f}")
    print(f"  Test Accuracy:  {test_acc_rf*100:.2f}% | Test ROC-AUC:  {test_roc_rf:.4f}")
    print(f"  Generalization Gap (Train - Test): {(train_acc_rf - test_acc_rf)*100:.2f}%")
    print(f"  Test Precision: {test_prec_rf*100:.2f}% | Test Recall: {test_rec_rf*100:.2f}% | Test F1: {test_f1_rf*100:.2f}%")

    # -------------------------------------------------------------------------
    # 3. Isolation Forest Anomaly Detector (200 Trees)
    # -------------------------------------------------------------------------
    iso_forest = IsolationForest(
        n_estimators=200,
        contamination=0.22,
        max_samples=0.8,
        random_state=42
    )
    iso_forest.fit(X_train_scaled)

    # Calibrate Isolation Forest score scaling
    raw_iso_train = -iso_forest.score_samples(X_train_scaled)
    iso_p10 = float(np.percentile(raw_iso_train, 10))
    iso_p90 = float(np.percentile(raw_iso_train, 90))
    iso_test_scores = -iso_forest.score_samples(X_test_scaled)
    test_roc_iso = roc_auc_score(y_test, iso_test_scores)
    iso_pred_test = np.where(iso_forest.predict(X_test_scaled) == -1, 1, 0)
    cm_iso = confusion_matrix(y_test, iso_pred_test).tolist()

    print("\n[3. ISOLATION FOREST ANOMALY DETECTOR]")
    print(f"  Held-Out Test ROC-AUC on Anomaly Scores: {test_roc_iso:.4f}")
    print(f"  Score Calibration Percentiles: P10={iso_p10:.4f}, P90={iso_p90:.4f}")

    # Feature Importance Mapping
    feat_importances = {
        name: round(float(imp), 4)
        for name, imp in zip(FEATURE_NAMES, rf.feature_importances_)
    }

    # Save Models
    joblib.dump(dt, os.path.join(MODELS_DIR, "decision_tree.joblib"))
    joblib.dump(rf, os.path.join(MODELS_DIR, "random_forest.joblib"))
    joblib.dump(iso_forest, os.path.join(MODELS_DIR, "isolation_forest.joblib"))
    joblib.dump(scaler, os.path.join(MODELS_DIR, "scaler.joblib"))

    # Save complete metadata document
    metadata = {
        "status": "TRAINED_WITH_EXPLICIT_SPLIT",
        "training_timestamp": pd.Timestamp.now().isoformat(),
        "training_method": "Stratified 80/20 Train/Test Split (Zero Data Leakage)",
        "dataset_split": {
            "total_samples": int(len(df)),
            "train_samples": int(len(X_train)),
            "train_ratio": 0.80,
            "test_samples": int(len(X_test)),
            "synthetic_samples": 0,
            "real_samples": int(len(df)),
            "dataset_sources": "100% Real Open-Source Datasets (Hugging Face & SecLists / PayloadsAllTheThings / Stanford)",
            "train_benign": int(np.sum(y_train == 0)),
            "train_malicious": int(np.sum(y_train == 1)),
            "test_benign": int(np.sum(y_test == 0)),
            "test_malicious": int(np.sum(y_test == 1)),
            "dataset_files_breakdown": breakdown
        },
        "feature_names": FEATURE_NAMES,
        "feature_importances": feat_importances,
        "iso_calibration": {
            "iso_p10": round(iso_p10, 4),
            "iso_p90": round(iso_p90, 4)
        },
        "models": {
            "decision_tree": {
                "name": "Regularized Decision Tree (CART)",
                "train_accuracy": round(float(train_acc_dt), 4),
                "test_accuracy": round(float(test_acc_dt), 4),
                "train_roc_auc": round(float(train_roc_dt), 4),
                "test_roc_auc": round(float(test_roc_dt), 4),
                "test_precision": round(float(test_prec_dt), 4),
                "test_recall": round(float(test_rec_dt), 4),
                "test_f1": round(float(test_f1_dt), 4),
                "generalization_gap": round(float(train_acc_dt - test_acc_dt), 4),
                "confusion_matrix_test": cm_dt,
                "role": "Interpretable Fast Rule-Based Classification"
            },
            "random_forest": {
                "name": "Robust Random Forest Ensemble (150 Trees)",
                "train_accuracy": round(float(train_acc_rf), 4),
                "test_accuracy": round(float(test_acc_rf), 4),
                "train_roc_auc": round(float(train_roc_rf), 4),
                "test_roc_auc": round(float(test_roc_rf), 4),
                "test_precision": round(float(test_prec_rf), 4),
                "test_recall": round(float(test_rec_rf), 4),
                "test_f1": round(float(test_f1_rf), 4),
                "generalization_gap": round(float(train_acc_rf - test_acc_rf), 4),
                "confusion_matrix_test": cm_rf,
                "role": "High-Precision Action Risk Probability"
            },
            "isolation_forest": {
                "name": "Isolation Forest Anomaly Detector (200 Trees)",
                "test_roc_auc": round(float(test_roc_iso), 4),
                "contamination": 0.22,
                "confusion_matrix_test": cm_iso,
                "role": "Zero-Day Behavioral Outlier & Frequency Spike Detector"
            }
        }
    }

    with open(os.path.join(MODELS_DIR, "model_metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print("\n" + "=" * 75)
    print("SUCCESS: ALL ML MODELS RETRAINED ROBUSTLY ON REAL DATASETS!")
    print(f"Total Authentic Samples: {len(df):,}")
    print(f"Decision Tree:    Train Acc = {train_acc_dt*100:.2f}% | Test Acc = {test_acc_dt*100:.2f}% | Gap = {(train_acc_dt - test_acc_dt)*100:.2f}%")
    print(f"Random Forest:    Train Acc = {train_acc_rf*100:.2f}% | Test Acc = {test_acc_rf*100:.2f}% | Gap = {(train_acc_rf - test_acc_rf)*100:.2f}%")
    print(f"Isolation Forest: Test ROC-AUC = {test_roc_iso:.4f}")
    print(f"Saved artifacts to {MODELS_DIR}")
    print("=" * 75)

if __name__ == "__main__":
    train_robust_ml_models()
