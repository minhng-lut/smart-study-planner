from fastapi import FastAPI
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from datetime import datetime

app = FastAPI()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


class TaskInput(BaseModel):
    id: Optional[int] = None
    courseId: Optional[int] = None
    title: str
    estimatedHours: Optional[float] = 0
    actualHours: Optional[float] = 0
    status: Optional[str] = "pending"


class AnalyzeRequest(BaseModel):
    userId: int
    tasks: List[TaskInput]


class AnalyzeResult(BaseModel):
    generatedAt: datetime
    workloadScore: Optional[float]
    riskLevel: Optional[str]
    recommendedHoursPerDay: Optional[float]
    summaryJson: Optional[Dict[str, Any]]


@app.post("/analyze", response_model=AnalyzeResult)
def analyze(req: AnalyzeRequest):
    # this is an example analytics calculation. we are going to replace this with the actual logic later.
    total_estimated = sum((t.estimatedHours or 0) for t in req.tasks)
    total_actual = sum((t.actualHours or 0) for t in req.tasks)

    workload = None
    if len(req.tasks) > 0:
        workload = float(min(100, (total_estimated + total_actual) / max(1, len(req.tasks)) * 10))

    # simple risk heuristic
    if workload is None:
        risk = "none"
    elif workload < 20:
        risk = "low"
    elif workload < 50:
        risk = "medium"
    else:
        risk = "high"

    recommended = 2.0 if risk == "low" else 1.5 if risk == "medium" else 1.0

    summary = {
        "taskCount": len(req.tasks),
        "totalEstimated": total_estimated,
        "totalActual": total_actual
    }

    return AnalyzeResult(
        generatedAt=datetime.utcnow(),
        workloadScore=workload,
        riskLevel=risk,
        recommendedHoursPerDay=recommended,
        summaryJson=summary
    )

