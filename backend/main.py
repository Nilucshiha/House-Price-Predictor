from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from model import FEATURES, price_model

app = FastAPI(title="House Price Predictor API")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    IncomeLevel: float
    PropertyAge: float
    TotalRooms: float
    TotalBedrooms: float
    NeighborhoodPop: float
    AvgOccupancy: float
    Latitude: float
    Longitude: float


@app.get("/api/feature-ranges")
def feature_ranges():
    return {"features": FEATURES, "ranges": price_model.ranges, "metrics": price_model.metrics}


@app.post("/api/predict")
def predict(req: PredictRequest):
    values = req.model_dump()
    for f in FEATURES:
        v = values[f]
        lo, hi = price_model.ranges[f]["min"], price_model.ranges[f]["max"]
        lo_bound, hi_bound = lo - abs(lo) * 0.5 - 1, hi + abs(hi) * 0.5 + 1
        if not (lo_bound <= v <= hi_bound):
            raise HTTPException(
                status_code=422,
                detail=f"{f}={v} is out of a plausible range ({lo_bound:.3f} to {hi_bound:.3f})",
            )
    return price_model.predict(values)
