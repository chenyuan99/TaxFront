from langchain_community.llms import Ollama
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import OllamaEmbeddings
from langchain.prompts import PromptTemplate

# Load the FAISS index with embeddings and the LLM
embeddings = OllamaEmbeddings(model="command-r")
vectorstore = FAISS.load_local(
    "faiss_index", embeddings, allow_dangerous_deserialization=True
)
llm = Ollama(model="command-r")

# Define the prompt template
prompt_template = """
You are a highly knowledgeable tax assistant, trained on all tax regulations from the California Department of Tax and Fee Administration (CDTFA).
Your job is to provide accurate tax-related answers based on the official information from CDTFA documents.
Always include a reference to the source when providing an answer.

Context: {context}
Query: {query}
Answer:
"""
prompt = PromptTemplate(template=prompt_template, input_variables=["context", "query"])


# Helper function to format the retrieved documents
def format_context(docs):
    return "\n\n".join([doc.page_content for doc in docs])


# Main loop for terminal-based interaction
def chat_with_bot():
    print(
        "Start chatting with the tax assistant. Type 'I want to end this conversation' to exit."
    )

    while True:
        # Get user query
        user_query = input("\nYou: ")

        # Handle exit condition
        if user_query.lower() in [
            "i want to end this conversation",
            "exit",
            "done",
            "quit",
        ]:
            print("Chatbot: Thank you for using the chatbot. Goodbye!")
            break

        # Retrieve relevant documents using FAISS
        docs = vectorstore.similarity_search(user_query, k=4)
        context = format_context(docs)

        # Generate a response using the Command R model and the retrieved context
        inputs = {"context": context, "query": user_query}
        response = llm.invoke(prompt.format(**inputs))  # Use invoke instead of __call__

        # Print the chatbot's response
        print(f"Chatbot: {response}")


if __name__ == "__main__":
    chat_with_bot()
