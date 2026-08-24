import subprocess
import os
import sys
from pathlib import Path

root = Path(r"c:/AI-Powered-Smart-Retail-Product-Recommendation-Customer-Behavior-Analysis-System")
git_exe = r"C:\git-tools\cmd\git.exe"
gh_exe = r"C:\git-tools\gh.exe"

env = os.environ.copy()
env["PATH"] = r"C:\git-tools;C:\git-tools\cmd;" + env.get("PATH", "")

def run_cmd(args):
    print("EXECUTING:", args)
    res = subprocess.run(args, cwd=root, env=env, capture_output=True, text=True)
    print("STDOUT:", res.stdout)
    if res.stderr:
        print("STDERR:", res.stderr)
    return res

# 1. Check gh auth
run_cmd([gh_exe, "auth", "status"])

# 2. Init git & branch
run_cmd([git_exe, "init"])
run_cmd([git_exe, "branch", "-M", "main"])

# 3. Add files
run_cmd([git_exe, "add", "."])

# 4. Check git status
st = run_cmd([git_exe, "status"])
st_out = st.stdout

# 5. Verify staged files safety
staged_files = []
for line in st_out.splitlines():
    if "new file:" in line or "modified:" in line:
        staged_files.append(line.split(":")[-1].strip())

print(f"\nTOTAL STAGED FILES: {len(staged_files)}")

forbidden_rules = [".env", "online_retail_II.xlsx", ".joblib", "node_modules", "retail_iq.db"]
violations = []
for f in staged_files:
    if f.endswith(".env.example") or f == "ml/data/README.md":
        continue
    if f.endswith(".env") or "online_retail_II.xlsx" in f or f.endswith(".joblib") or "node_modules" in f or f.endswith(".db"):
        violations.append(f)

print("FORBIDDEN FILE VIOLATIONS:", violations)
if violations:
    print("CRITICAL SAFETY STOP: Forbidden files staged!")
    sys.exit(1)


# 6. Commit
run_cmd([git_exe, "commit", "-m", "Initial release: RetailIQ AI full-stack ML application"])

# 7. Create repo & push
repo_res = run_cmd([gh_exe, "repo", "create", "retailiq-ai", "--public", "--source=.", "--remote=origin", "--push", "--description", "AI-powered retail analytics platform with RFM customer segmentation, 30-day purchase prediction, collaborative product recommendations, FastAPI, PostgreSQL, and React."])

# 8. Verify status
run_cmd([git_exe, "remote", "-v"])
run_cmd([git_exe, "log", "-1"])
