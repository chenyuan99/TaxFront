# Simple RAG pipeline with LangChain tracing using OpenAI
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

# Import RAG components
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain.text_splitter import CharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain_core.documents import Document

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.FileHandler("debug.log"), logging.StreamHandler()],
)

load_dotenv()

# Check for OpenAI API key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    logging.error("OPENAI_API_KEY environment variable not set")
    sys.exit(1)

# Configure LangChain tracing
logging.info("Checking LangChain tracing configuration...")
LANGCHAIN_TRACING_V2 = os.getenv("LANGCHAIN_TRACING_V2", "false").lower() == "true"
LANGCHAIN_ENDPOINT = os.getenv("LANGCHAIN_ENDPOINT")
LANGCHAIN_API_KEY = os.getenv("LANGCHAIN_API_KEY")

if LANGCHAIN_TRACING_V2:
    logging.info("LangChain tracing V2 enabled")
    if LANGCHAIN_ENDPOINT:
        logging.info(f"Using LangChain endpoint: {LANGCHAIN_ENDPOINT}")
    if LANGCHAIN_API_KEY:
        logging.info("LangChain API key is set")
    else:
        logging.warning("LangChain API key is not set")
else:
    logging.warning("LangChain tracing V2 is not enabled")

# Initialize tracing callback manager if tracing is enabled
callback_manager = None
if LANGCHAIN_TRACING_V2:
    try:
        tracer = LangChainTracer()
        callback_manager = CallbackManager([tracer])
        logging.info("Tracing callback manager initialized successfully")
    except Exception as e:
        logging.error(f"Error initializing LangChain tracer: {e}")

# Sample documents for our RAG system
documents = [
    "Apples are rich in fiber, vitamins, and minerals. They may help reduce the risk of heart disease and certain cancers.",
    "Bananas are high in potassium and contain good amounts of vitamin B6. They can help moderate blood sugar levels.",
    "Oranges are an excellent source of vitamin C and antioxidants. They support immune system function and skin health.",
    "Strawberries are packed with antioxidants and vitamin C. They may help improve heart health and blood sugar control.",
    "Blueberries are believed to have one of the highest antioxidant levels among common fruits and vegetables."
]

# Create a text splitter
text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=0)

# Create Document objects and split them into chunks
docs = [Document(page_content=doc) for doc in documents]
texts = text_splitter.split_documents(docs)
logging.info(f"Split {len(documents)} documents into {len(texts)} chunks")

# Initialize the embeddings model
embedding_kwargs = {"model": "text-embedding-ada-002"}

# Initialize embeddings without callbacks (they'll be passed separately)
embeddings = OpenAIEmbeddings(**embedding_kwargs)
logging.info("Embeddings model initialized")

# Create a vector store
try:
    logging.info("Creating FAISS vector store...")
    
    # Create the vector store without passing callbacks directly
    vector_store = FAISS.from_documents(texts, embeddings)
    logging.info("FAISS vector store created successfully")
except Exception as e:
    logging.error(f"Error creating vector store: {e}")
    sys.exit(1)

# Initialize the LLM
llm_kwargs = {
    "temperature": 0.7,
    "model_name": "gpt-3.5-turbo-instruct"
}

# Initialize the LLM without callbacks (they'll be passed separately when running the chain)
llm = OpenAI(**llm_kwargs)
logging.info("LLM initialized")

# Create a retrieval QA chain
try:
    logging.info("Creating RetrievalQA chain...")
    
    qa_chain_kwargs = {
        "retriever": vector_store.as_retriever(),
        "llm": llm,
        "return_source_documents": True
    }
    
    # Create the chain without callbacks (they'll be passed when running the chain)
    qa_chain = RetrievalQA.from_chain_type(**qa_chain_kwargs)
    
    logging.info("RetrievalQA chain created successfully")
except Exception as e:
    logging.error(f"Error creating RetrievalQA chain: {e}")
    sys.exit(1)

# Run the chain with tracing
try:
    query = "What are the health benefits of apples?"
    logging.info(f"Running RetrievalQA chain with the query: '{query}'")
    
    # Create the inputs dictionary
    inputs = {"query": query}
    
    # Run with tracing enabled by environment variables
    # Use invoke() instead of __call__() to avoid deprecation warning
    result = qa_chain.invoke(inputs)
    
    logging.info("Chain execution completed successfully")
    logging.info(f"Answer: {result['result']}")
    
    # Log source documents
    logging.info("Source documents:")
    for i, doc in enumerate(result['source_documents']):
        logging.info(f"Document {i+1}: {doc.page_content}")
    
    if LANGCHAIN_TRACING_V2:
        logging.info("Traces have been sent to the LangChain API")
        logging.info("You can view them in the LangSmith UI at https://smith.langchain.com")
except Exception as e:
    logging.error(f"Error running the chain: {e}")
