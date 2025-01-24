# Update the deprecated imports to the new ones
import sys

from firebase_admin import firestore
from langchain_ollama import OllamaEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
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

# Load the scraped data
# with open("metadata.txt", "r", encoding="utf-8") as f:
#     data = f.read()
# logging.info("Done loading scraped data....")
# # Split the data into manageable chunks
# text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
# chunks = text_splitter.split_text(data)
# logging.info("Done splitting data to chunks....")
# # Create embeddings using the Command R model from Ollama
# # embeddings = OllamaEmbeddings(model="command-r")


from openai import OpenAI

client = OpenAI()

response = client.embeddings.create(
    input="Your text string goes here", model="text-embedding-3-small"
)

logging.info(response.data[0].embedding)

firestore_client = firestore.Client()
collection = firestore_client.collection("coffee-beans")
doc = {
    "name": "Kahawa coffee beans",
    "description": "Information about the Kahawa coffee beans.",
    "embedding_field": response.data[0].embedding,
}

collection.add(doc)

# print('Done creating embeddings....')
# # Create FAISS index from the chunks
# vectorstore = FAISS.from_texts(chunks, response.data[0].embedding)
#
# print('Done creating FAISS index...')
# # Save the FAISS index for later retrieval
# vectorstore.save_local('faiss_index')
# print('Saved FAISS index for future retrieval ...')
