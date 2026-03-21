#!/usr/bin/env python
"""Initialize database and start backend server"""
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

print("[*] Initializing backend...\n")

# Create database tables
from database import Base, engine
from models import Patient, ScreeningResult, ChatMessage, DocumentChunk

print("[DB] Creating database tables...")
Base.metadata.create_all(bind=engine)
print("[OK] Database tables created\n")

# Test imports
try:
    from config import get_settings
    settings = get_settings()
    print("[CONFIG] Groq API configured: {}".format(bool(settings.groq_api_key)))
    print("[CONFIG] Database: {}".format(settings.database_url))
    print("[CONFIG] RAG sources: {} found\n".format(len(settings.rag_sources)))
except Exception as e:
    print("[WARN] Config warning: {}\n".format(e))

# Initialize RAG service
try:
    from services.rag_service import RAGService
    rag = RAGService()
    print("[RAG] Warming up RAG service...")
    rag.warm()
    print("[OK] RAG ready ({} documents indexed)\n".format(len(rag.docs)))
except Exception as e:
    print("[WARN] RAG warning: {}\n".format(e))

# Test Chat service
try:
    from services.chat_service import ChatService
    from services.rag_service import RAGService
    rag = RAGService()
    rag.warm()
    chat = ChatService(rag)
    print("[OK] Chat service initialized\n")
except Exception as e:
    print("[WARN] Chat service issue: {}".format(e))
    print("     (Chat will be disabled until GROQ_API_KEY is set)\n")

print("=" * 70)
print("[*] Starting FastAPI server...")
print("=" * 70)
print()

# Start server
import uvicorn
uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
