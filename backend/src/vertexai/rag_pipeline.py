# Update the deprecated imports to the new ones
import sys

from firebase_admin import firestore
from langchain_google_firestore import FirestoreVectorStore
from langchain_google_vertexai import VertexAIEmbeddings
import os
from dotenv import load_dotenv
from google.cloud import firestore
from google.cloud.firestore_v1.vector import Vector
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.FileHandler("debug.log"), logging.StreamHandler()],
)

load_dotenv()

COLLECTION_NAME = "vertexai-langchain"

# vertexai.init()

embedding = VertexAIEmbeddings(
    model_name="textembedding-gecko@latest",
    project="taxfront-448104",
)

ids = ["apple", "banana", "orange"]
fruits_texts = ['{"name": "apple"}', '{"name": "banana"}', '{"name": "orange"}']

# Create a vector store
vector_store = FirestoreVectorStore(
    collection=COLLECTION_NAME,
    embedding_service=embedding,
)

# Add the fruits to the vector store
vector_store.add_texts(fruits_texts, ids=ids)