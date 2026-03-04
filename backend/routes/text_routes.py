from fastapi import APIRouter, Request
from controllers.text_controller import TextController

router = APIRouter(prefix="/api/text", tags=["text"])
@router.post("/tokenize")
async def tokenize(request: Request):
    body = await request.json()

    return await TextController.tokenize(
        text=body.get("text", ""),
        token_type=body.get("token_type", ""),
        n=body.get("n", 2),
    )


@router.post("/basic-cleaning")
async def basic_cleaning(request: Request):
    body = await request.json()
    return await TextController.basic_clean(text=body.get("text", ""), operations=body.get("operations", []))


@router.post("/filtering")
async def filtering(request: Request):
    body = await request.json()
    return await TextController.filtering(
        text=body.get("text", ""),
        remove_stop_words=body.get("remove_stop_words", True),
        min_word_length=body.get("min_word_length", 1),
    )


@router.post("/normalize")
async def normalize_text(request: Request):
    body = await request.json()
    return await TextController.normalize_text(
        text=body.get("text", ""),
        method=body.get("method", ""),
        stemming_algorithm=body.get("stemming_algorithm", "porter"),
    )


@router.post("/feature-extraction")
async def feature_extraction(request: Request):
    body = await request.json()
    return await TextController.feature_extraction(
        text=body.get("text", ""),
        method=body.get("method", ""),
        max_features=body.get("max_features", 1000),
        ngram_range=body.get("ngram_range", "1-1"),
        vector_size=body.get("vector_size", 100),
    )


@router.get("/feature-extraction/{extraction_id}")
async def get_feature_extraction_result(extraction_id: str):
    return await TextController.get_feature_extraction_result(extraction_id)
