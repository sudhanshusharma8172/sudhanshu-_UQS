"""
download_model.py
=================
Downloads and caches the SentenceTransformer model locally so that it is packaged
with the build/container. This avoids downloading it at runtime (startup),
preventing service timeouts and Hugging Face rate limit or availability issues.
"""

import os
import sys
from pathlib import Path

def download_model():
    model_name = "all-MiniLM-L6-v2"
    base_dir = Path(__file__).resolve().parent
    save_path = base_dir / "models" / model_name

    # If the local cache folder already has model files, skip the download
    if save_path.exists() and any(save_path.iterdir()):
        print(f"[*] Local cache found at {save_path}. Skipping model download.")
        return

    print(f"[*] Downloading SentenceTransformer model '{model_name}' to local directory '{save_path}'...")
    save_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        # Import sentence_transformers here so it's not required for loading metadata or quick tests
        from sentence_transformers import SentenceTransformer
        
        # Download and load the model
        model = SentenceTransformer(model_name)
        
        # Save it to the target local folder
        model.save(str(save_path))
        print(f"[+] Model '{model_name}' downloaded and saved successfully to {save_path}!")
    except Exception as e:
        print(f"[!] Error downloading model: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    download_model()
