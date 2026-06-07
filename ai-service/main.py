from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List
import base64
import json
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

from services.gemini_service import gemini_service

app = FastAPI(title="TDC Exchange AI Service")

# -- Models --
class GenerateRequest(BaseModel):
    prompt: str
    system_prompt: Optional[str] = None

class ModerateRequest(BaseModel):
    text: str

class EmbeddingRequest(BaseModel):
    text: str

class CandidateProduct(BaseModel):
    id: int
    text: str

class MatchProductsRequest(BaseModel):
    target_product_text: str
    candidates: List[CandidateProduct]

class GenerateDescriptionRequest(BaseModel):
    imageBase64: str
    category: str

class SuggestPriceRequest(BaseModel):
    imageBase64: str
    category: str
    condition: str
    description: str

class AnalyzeImageQualityRequest(BaseModel):
    imageBase64: str
    category: str

# -- Endpoints --
@app.get("/")
def read_root():
    return {"status": "AI Service is running"}

@app.post("/api/ai/generate")
def generate_text(request: GenerateRequest):
    """
    Sử dụng Gemini để gen nội dung (mô tả, tiêu đề, đàm phán chat)
    """
    response = gemini_service.generate(request.prompt, request.system_prompt)
    return {"success": True, "data": {"text": response}}

@app.post("/api/ai/moderate")
def moderate_text(request: ModerateRequest):
    """
    Sử dụng Gemini để phân tích ngôn từ kích động/spam
    """
    system_prompt = "Bạn là AI kiểm duyệt. Hãy trả lời 'VI_PHAM' nếu văn bản chứa từ ngữ thô tục, chửi thề, lừa đảo hoặc spam. Nếu không, trả lời 'AN_TOAN'."
    response = gemini_service.generate(request.text, system_prompt)
    
    # Chuẩn hóa chuỗi (viết hoa, bỏ dấu tiếng Việt) để kiểm tra vi phạm một cách chính xác
    import unicodedata
    resp_upper = response.upper()
    resp_normalized = ''.join(c for c in unicodedata.normalize('NFD', resp_upper) if unicodedata.category(c) != 'Mn')
    
    # An toàn nếu KHÔNG chứa từ khóa vi phạm (ví dụ: "VI_PHAM", "VI PHAM", "VIPHAM")
    has_violation = "VI_PHAM" in resp_normalized or "VI PHAM" in resp_normalized or "VIPHAM" in resp_normalized
    is_safe = not has_violation
    
    return {
        "success": True,
        "data": {
            "isSafe": is_safe,
            "reasoning": response
        }
    }

@app.post("/api/ai/embedding")
def get_embedding(request: EmbeddingRequest):
    """
    Tạo vector cho chuỗi văn bản (dùng cho tính năng Search)
    """
    vector = gemini_service.generate_embedding(request.text)
    return {"success": True, "data": {"embedding": vector}}

@app.post("/api/ai/match-products")
def match_products(request: MatchProductsRequest):
    """
    Xếp hạng các sản phẩm ứng viên dựa trên độ tương đồng ngữ nghĩa (AI)
    """
    if not request.candidates:
        return {"success": True, "data": {"matches": []}}
        
    candidate_texts = [cand.text for cand in request.candidates]
    similarities = gemini_service.calculate_similarities(request.target_product_text, candidate_texts)
    
    matches = []
    for i, cand in enumerate(request.candidates):
        matches.append({
            "id": cand.id,
            "similarity": similarities[i]
        })
        
    # Sắp xếp giảm dần theo similarity
    matches.sort(key=lambda x: x["similarity"], reverse=True)
    
    return {"success": True, "data": {"matches": matches}}


@app.post("/api/ai/generate-description")
async def generate_description(request: GenerateDescriptionRequest):
    """
    Sinh mô tả sản phẩm hấp dẫn dựa trên hình ảnh và danh mục.
    """
    system_prompt = f"""Bạn là chuyên gia viết content bán hàng cho đồ cũ sinh viên.
Nhiệm vụ: Viết một đoạn mô tả (description) thật hấp dẫn, nêu bật lợi ích của sản phẩm dựa trên hình ảnh được cung cấp.
Danh mục sản phẩm: {request.category}

Yêu cầu:
- Viết bằng tiếng Việt, ngắn gọn (3-5 câu), chuẩn SEO.
- Chỉ trả về ĐÚNG đoạn văn bản mô tả, KHÔNG giải thích thêm, KHÔNG dùng markdown định dạng phức tạp."""

    try:
        # Sử dụng model text/vision của Gemini
        response_text = gemini_service.generate_with_image("Hãy viết mô tả bán hàng cho sản phẩm trong ảnh này.", request.imageBase64, system_prompt)
        
        # Vì Gemini có thể output JSON do cấu hình mặc định trong hàm generate_with_image, 
        # nên nếu nó trả về JSON mình sẽ cố gắng bóc tách, hoặc sửa cấu hình bên service.
        # Tạm thời cứ trả về response_text.
        return {"success": True, "data": {"description": response_text.strip()}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi AI viết mô tả: {str(e)}")

@app.post("/api/ai/suggest-price")
async def suggest_price(request: SuggestPriceRequest):
    """
    Gợi ý mức giá thanh lý tốt nhất dựa trên hình ảnh, danh mục và tình trạng.
    """
    system_prompt = f"""Bạn là chuyên gia định giá đồ cũ cho ứng dụng mua bán sinh viên.
Nhiệm vụ: Đưa ra MỘT mức giá (bằng VNĐ) hợp lý nhất để bán nhanh sản phẩm trong ảnh.
Thông tin tham khảo:
- Danh mục: {request.category}
- Tình trạng: {request.condition}
- Mô tả hiện tại: {request.description}

Yêu cầu BẮT BUỘC:
- CHỈ trả về MỘT con số nguyên duy nhất (ví dụ: 150000).
- KHÔNG thêm chữ "VNĐ", "đồng", KHÔNG dùng dấu chấm hay phẩy, KHÔNG giải thích thêm bất cứ từ nào."""

    try:
        response_text = gemini_service.generate_with_image("Định giá sản phẩm này theo yêu cầu.", request.imageBase64, system_prompt)
        
        # Lọc ra chỉ lấy các chữ số từ phản hồi (đề phòng AI vẫn thêm chữ)
        import re
        numbers = re.findall(r'\d+', response_text)
        if numbers:
            suggested_price = int("".join(numbers))
        else:
            suggested_price = 0
            
        return {"success": True, "data": {"price": suggested_price}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi AI định giá: {str(e)}")

@app.post("/api/ai/analyze-image-quality")
async def analyze_image_quality(request: AnalyzeImageQualityRequest):
    """
    Phân tích chất lượng hình ảnh ngay khi người dùng chụp, dựa trên các tiêu chí cụ thể.
    """
    system_prompt = f"""Bạn là một chuyên gia kiểm duyệt hình ảnh sản phẩm thanh lý.
Nhiệm vụ của bạn là phân tích bức ảnh được cung cấp dựa trên các tiêu chí sau:
1. Độ sắc nét: Ảnh có bị mờ, out nét không?
2. Độ sáng và độ tương phản: Ảnh có quá tối hay chói sáng không?
3. Độ nhiễu: Ảnh có bị noise/hạt nhiều không?
4. Độ nổi bật của vật thể: Sản phẩm cần bán phải nằm ở trung tâm và chiếm diện tích đủ lớn.
5. Nhận diện bối cảnh: Hậu cảnh có quá lộn xộn, gây mất tập trung không?
6. Sự phù hợp với Danh mục: Danh mục là "{request.category}". Ảnh có đúng là sản phẩm thuộc danh mục này không?
7. Phát hiện ảnh mạng/ảnh Stock: Ảnh có vẻ là ảnh chụp thực tế hay ảnh tải trên mạng?

Từ các đánh giá trên, hãy xếp loại bức ảnh vào đúng MỘT trong ba trạng thái:
- "Tốt": Ảnh chụp rõ nét, đủ sáng, bố cục tốt, đúng danh mục.
- "Khá/Mờ": Ảnh hơi mờ, hơi tối hoặc hậu cảnh hơi lộn xộn, nhưng vẫn có thể nhìn rõ sản phẩm.
- "Tệ": Ảnh quá mờ, quá tối, sai danh mục, hoặc nghi ngờ là ảnh mạng.

Yêu cầu BẮT BUỘC:
Trả về phản hồi dưới dạng JSON với định dạng chính xác sau (không bọc trong markdown code block, chỉ là JSON raw):
{{
    "state": "Tốt" hoặc "Khá/Mờ" hoặc "Tệ",
    "message": "Lời giải thích ngắn gọn (1-2 câu) về lý do chọn trạng thái này"
}}"""

    try:
        response_text = gemini_service.generate_with_image("Hãy phân tích chất lượng ảnh này và trả về JSON.", request.imageBase64, system_prompt)
        
        # Clean up response if it contains markdown JSON blocks
        response_text = response_text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        import json
        result = json.loads(response_text.strip())
        
        return {
            "success": True, 
            "data": {
                "state": result.get("state", "Tệ"),
                "message": result.get("message", "Không thể phân tích ảnh.")
            }
        }
    except Exception as e:
        print(f"Error parsing AI response: {e}")
        return {
            "success": True,
            "data": {
                "state": "Khá/Mờ",
                "message": "Không thể nhận diện chi tiết, vui lòng tự kiểm tra lại ảnh."
            }
        }
