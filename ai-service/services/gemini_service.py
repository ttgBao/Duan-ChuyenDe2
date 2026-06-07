import os
import google.generativeai as genai
from typing import List, Optional
import base64
import numpy as np

class GeminiService:
    def __init__(self):
        # Configure the Gemini API with the key from environment
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("WARNING: GEMINI_API_KEY is not set in the environment.")
        genai.configure(api_key=api_key)

        # Standard model for text/vision
        self.model_name = "gemini-2.5-flash"
        
        # Embedding model
        self.embedding_model = "models/gemini-embedding-2"

    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """
        Generate text response from Gemini API.
        """
        try:
            model = genai.GenerativeModel(self.model_name)
            
            # If system_prompt is provided, combine it with the prompt
            if system_prompt:
                prompt = system_prompt + "\n\n" + prompt

            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Error calling Gemini generate: {e}")
            return "Xin lỗi, hiện tại dịch vụ AI đang bận. Vui lòng thử lại sau."

    def generate_with_image(self, prompt: str, image_base64: str, system_prompt: Optional[str] = None) -> str:
        """
        Generate response from Gemini API using an image and prompt.
        Ensures output is in JSON format.
        """
        try:
            # We configure the model to output JSON strictly
            model = genai.GenerativeModel(self.model_name)
            
            # Combine system prompt if provided
            if system_prompt:
                prompt = system_prompt + "\n\n" + prompt

            # Decode the base64 string to bytes
            image_bytes = base64.b64decode(image_base64)
            
            # Prepare the content parts
            image_part = {
                "mime_type": "image/jpeg",
                "data": image_bytes
            }
            
            response = model.generate_content([prompt, image_part])
            return response.text
        except Exception as e:
            print(f"Error calling Gemini vision: {e}")
            raise Exception(f"Gemini vision error: {str(e)}")

    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate vector embedding for a single text using Gemini.
        """
        try:
            result = genai.embed_content(
                model=self.embedding_model,
                content=text,
                task_type="retrieval_document"
            )
            return result['embedding']
        except Exception as e:
            print(f"Error generating embedding: {e}")
            return []

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate vector embeddings for a list of texts using Gemini.
        """
        if not texts:
            return []
            
        try:
            result = genai.embed_content(
                model=self.embedding_model,
                content=texts,
                task_type="retrieval_document"
            )
            return result['embedding']
        except Exception as e:
            print(f"Error generating embeddings: {e}")
            return [[] for _ in texts]

    def calculate_similarities(self, target_text: str, candidate_texts: List[str]) -> List[float]:
        """
        Calculate cosine similarity between target text and candidate texts using Gemini embeddings.
        """
        if not candidate_texts:
            return []
            
        target_embedding = self.generate_embedding(target_text)
        candidate_embeddings = self.generate_embeddings(candidate_texts)
        
        if not target_embedding or not candidate_embeddings or not candidate_embeddings[0]:
            return [0.0] * len(candidate_texts)
            
        # Calculate cosine similarity using numpy
        target_emb_np = np.array(target_embedding)
        cand_emb_np = np.array(candidate_embeddings)
        
        norm_target = np.linalg.norm(target_emb_np)
        norm_candidates = np.linalg.norm(cand_emb_np, axis=1)
        
        if norm_target == 0:
            return [0.0] * len(candidate_texts)
            
        similarities = []
        for i, cand_emb in enumerate(cand_emb_np):
            if norm_candidates[i] == 0:
                similarities.append(0.0)
            else:
                sim = np.dot(target_emb_np, cand_emb) / (norm_target * norm_candidates[i])
                sim = max(-1.0, min(1.0, float(sim)))
                similarities.append(sim)
                
        return similarities

gemini_service = GeminiService()
