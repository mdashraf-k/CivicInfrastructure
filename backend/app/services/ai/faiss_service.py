import os
import json
import threading
from typing import List, Dict, Any, Tuple, Optional
import numpy as np

try:
    import faiss
    HAS_FAISS = True
except ImportError:
    HAS_FAISS = False

from app.core.config import settings

class FAISSService:
    """Thread-safe FAISS vector database service with local disk persistence and metadata mapping."""

    def __init__(self):
        self.lock = threading.Lock()
        self.dim = 512
        self.index_path = settings.FAISS_INDEX_PATH
        self.metadata_path = settings.FAISS_METADATA_PATH
        self.index = None
        self.metadata: Dict[int, Dict[str, str]] = {}  # vector_id (int) -> {"issue_id": ..., "image_id": ...}
        self.vector_count = 0
        self.fallback_vectors: List[np.ndarray] = []
        self._init_index()

    def _init_index(self):
        os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
        with self.lock:
            if HAS_FAISS and os.path.exists(self.index_path):
                try:
                    self.index = faiss.read_index(self.index_path)
                    if os.path.exists(self.metadata_path):
                        with open(self.metadata_path, 'r') as f:
                            raw_meta = json.load(f)
                            self.metadata = {int(k): v for k, v in raw_meta.items()}
                    self.vector_count = self.index.ntotal
                except Exception:
                    self._create_empty_index()
            else:
                self._create_empty_index()

    def _create_empty_index(self):
        if HAS_FAISS:
            self.index = faiss.IndexFlatIP(self.dim)  # Inner Product for normalized cosine similarity
        self.metadata = {}
        self.vector_count = 0
        self.fallback_vectors = []

    def _save_to_disk(self):
        try:
            os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
            if HAS_FAISS and self.index is not None:
                faiss.write_index(self.index, self.index_path)
            with open(self.metadata_path, 'w') as f:
                json.dump({str(k): v for k, v in self.metadata.items()}, f, indent=2)
        except Exception as e:
            print(f"Warning: Failed to save FAISS index/metadata to disk: {e}")

    def add_embedding(self, embedding: np.ndarray, issue_id: str, image_id: str) -> int:
        """Adds a normalized embedding vector to FAISS index."""
        with self.lock:
            vec = np.ascontiguousarray(embedding.reshape(1, -1), dtype=np.float32)
            vector_id = self.vector_count

            if HAS_FAISS and self.index is not None:
                self.index.add(vec)
            else:
                self.fallback_vectors.append(vec.flatten())

            self.metadata[vector_id] = {
                "issue_id": issue_id,
                "image_id": image_id
            }
            self.vector_count += 1
            self._save_to_disk()
            return vector_id

    def search_similar(self, query_embedding: np.ndarray, top_k: int = 5) -> List[Dict[str, Any]]:
        """Searches top-K visually similar issues using cosine similarity."""
        with self.lock:
            if self.vector_count == 0:
                return []

            query_vec = np.ascontiguousarray(query_embedding.reshape(1, -1), dtype=np.float32)
            results = []

            if HAS_FAISS and self.index is not None:
                k = min(top_k, self.index.ntotal)
                distances, indices = self.index.search(query_vec, k)

                for dist, idx in zip(distances[0], indices[0]):
                    if idx != -1 and idx in self.metadata:
                        sim = float(dist)
                        # Cosine similarity range [-1, 1] normalized to [0, 1]
                        normalized_sim = float(np.clip((sim + 1.0) / 2.0 if sim <= 1.0 else sim, 0.0, 1.0))
                        meta = self.metadata[idx]
                        results.append({
                            "vector_id": int(idx),
                            "issue_id": meta["issue_id"],
                            "image_id": meta["image_id"],
                            "similarity": round(normalized_sim, 4)
                        })
            else:
                # Numpy fallback cosine similarity
                for idx, vec in enumerate(self.fallback_vectors):
                    if idx in self.metadata:
                        sim = float(np.dot(query_vec.flatten(), vec))
                        normalized_sim = float(np.clip(sim, 0.0, 1.0))
                        meta = self.metadata[idx]
                        results.append({
                            "vector_id": idx,
                            "issue_id": meta["issue_id"],
                            "image_id": meta["image_id"],
                            "similarity": round(normalized_sim, 4)
                        })
                results.sort(key=lambda x: x["similarity"], reverse=True)
                results = results[:top_k]

            return results

faiss_service = FAISSService()
