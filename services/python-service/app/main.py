from fastapi import FastAPI

from app.analytics import AnalyzeRequest, AnalyzeResult, analyze

app = FastAPI()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResult)
def analyze_endpoint(req: AnalyzeRequest) -> AnalyzeResult:
    return analyze(req)
