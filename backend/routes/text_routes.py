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
