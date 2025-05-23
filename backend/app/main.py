from fastapi import FastAPI

app = FastAPI(title="DocuLock")


@app.get("/health")
def health_check():
    return {"status": "ok"}
