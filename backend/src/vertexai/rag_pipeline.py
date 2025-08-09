# Simple RAG pipeline with LangChain tracing
import os
import sys
import logging
from dotenv import load_dotenv

# Import LangChain components
from langchain.chains import LLMChain
from langchain_core.prompts import PromptTemplate
from langchain_openai import OpenAI
from langchain_core.tracers.langchain import LangChainTracer
from langchain.callbacks.manager import CallbackManager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.FileHandler("debug.log"), logging.StreamHandler()],
)

load_dotenv()

# Set Google Cloud credentials explicitly
GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if GOOGLE_APPLICATION_CREDENTIALS:
    # If the path is not absolute, make it relative to the backend directory
    if not os.path.isabs(GOOGLE_APPLICATION_CREDENTIALS):
        GOOGLE_APPLICATION_CREDENTIALS = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            GOOGLE_APPLICATION_CREDENTIALS
        )
    
    # Check if the credentials file exists
    if os.path.exists(GOOGLE_APPLICATION_CREDENTIALS):
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = GOOGLE_APPLICATION_CREDENTIALS
        logging.info(f"Using Google Cloud credentials from: {GOOGLE_APPLICATION_CREDENTIALS}")
    else:
        logging.error(f"Google Cloud credentials file not found: {GOOGLE_APPLICATION_CREDENTIALS}")
else:
    logging.warning("GOOGLE_APPLICATION_CREDENTIALS environment variable not set")

# Configure LangChain tracing
# LangChain V2 tracing is enabled by environment variables:
# LANGCHAIN_TRACING_V2=true
# LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
# LANGCHAIN_API_KEY=your_api_key

# Initialize tracing callback manager if tracing is enabled
callback_manager = None
if os.getenv("LANGCHAIN_TRACING_V2", "false").lower() == "true":
    logging.info("LangChain tracing V2 enabled")
    tracer = LangChainTracer()
    callback_manager = CallbackManager([tracer])
    logging.info("Tracing callback manager initialized")

COLLECTION_NAME = "vertexai-langchain"

# vertexai.init()

# Initialize embeddings
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
try:
    # If we have a callback manager, pass it to the add_texts method
    if callback_manager:
        vector_store.add_texts(fruits_texts, ids=ids, callbacks=[callback_manager])
    else:
        vector_store.add_texts(fruits_texts, ids=ids)
    
    logging.info(f"Successfully added {len(fruits_texts)} texts to vector store")
    logging.info("If tracing is enabled, traces have been sent to the LangChain API")
except Exception as e:
    logging.error(f"Error adding texts to vector store: {e}")