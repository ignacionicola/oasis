from fastapi import APIRouter, UploadFile, File, HTTPException
from app.skills.ticket_scanner import scan_ticket

router = APIRouter(prefix="/scanner", tags=["Scanner"])

_ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("/ticket")
async def scan_ticket_endpoint(image: UploadFile = File(...)):
    if image.content_type not in _ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Tipo de imagen no soportado: {image.content_type}. Usá JPEG, PNG o WebP.",
        )
    image_bytes = await image.read()
    return await scan_ticket(image_bytes, image.content_type)
