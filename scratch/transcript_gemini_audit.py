import os
import json

brain_dir = r"C:\Users\kev\.gemini\antigravity\brain"
matches = []

for d in os.listdir(brain_dir):
    log_file = os.path.join(brain_dir, d, ".system_generated", "logs", "transcript.jsonl")
    if os.path.exists(log_file):
        try:
            with open(log_file, "r", encoding="utf-8") as f:
                for line in f:
                    if not line.strip():
                        continue
                    try:
                        data = json.loads(line)
                        content = str(data.get("content", ""))
                        if any(k in content.lower() for k in ["gemini 3.5", "gemini-3.5", "gemini-1.5", "gemini-2.0", "googleai/", "model not found", "404"]):
                            matches.append({
                                "conv_id": d,
                                "step": data.get("step_index"),
                                "type": data.get("type"),
                                "content": content[:400]
                            })
                    except Exception:
                        pass
        except Exception:
            pass

print(f"Total matching steps found: {len(matches)}")
for m in matches[:30]:
    print(f"\n--- Conv {m['conv_id']} Step {m['step']} ({m['type']}) ---")
    print(m['content'])
