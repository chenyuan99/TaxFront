# TaxFront Backend

## Overview

Python backend for TaxFront — a tax document management and processing platform. It handles document ingestion, OCR/parsing, Firebase Cloud Functions, and AI-powered tax analysis through two specialized agents: an **Auditor** (compliance & risk) and an **Accountant** (preparation & optimization).

## Project Structure

```
backend/
├── app.py                      # Flask dev server (local testing only)
├── agents/                     # AI agents (Auditor + Accountant)
│   ├── auditor_agent.py        # Compliance verification & audit risk
│   ├── accountant_agent.py     # Tax preparation & optimization
│   ├── base_agent.py           # Shared LLM setup and run/stream interface
│   ├── tools/
│   │   ├── document_tools.py   # Firestore-backed document retrieval tools
│   │   └── tax_tools.py        # Pure IRS calculation tools (2024 rules)
│   └── tests/                  # Agent unit tests (81 tests, no API key needed)
├── parser/                     # Document parsing & Cloud Functions entry point
│   └── functions/
│       ├── main.py             # Firebase Cloud Functions (deployed)
│       └── parser.py           # PDF/OCR text extraction
├── embedding/                  # Vector embeddings service
│   └── functions/main.py
├── tax_forms/                  # IRS form filling & PDF generation
│   ├── form_filler.py
│   ├── form_definitions.py
│   └── routes.py
├── queue/                      # Async task queue backed by Firestore
│   ├── task_manager.py
│   └── task_processors.py
├── src/                        # Experimental RAG pipelines (Ollama / OpenAI)
├── prompts/                    # LLM prompt templates
├── faiss_index/                # FAISS vector index (local dev)
├── utils/                      # Browser automation utilities
└── requirements.txt
```

## Installation

1. Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Create a `.env` file:

```
OPENAI_API_KEY=your_openai_api_key
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

Firebase credentials use Application Default Credentials in production. For local development, set `GOOGLE_APPLICATION_CREDENTIALS` to the path of your service account JSON.

## AI Agents

Two agents are available under `agents/`. Both use LangChain 1.x (`create_agent`) with OpenAI tool-calling and share the same Firestore client.

### AuditorAgent

Reviews tax documents for compliance, accuracy, and audit risk.

**What it does:**
- Flags IRS audit triggers (high deduction ratios, round-number income, Schedule C losses, home office claims)
- Cross-references income across W-2s, 1099s, and other documents
- Detects duplicate employer EINs and missing required fields
- Produces a risk report scored LOW / MODERATE / ELEVATED / HIGH

```python
from agents import AuditorAgent
from firebase_admin import firestore

db = firestore.client()
auditor = AuditorAgent(db=db)
result = auditor.run("Audit all documents for user abc123 and give me a risk report.")
print(result["output"])
```

### AccountantAgent

Handles tax preparation, deduction discovery, and liability estimation.

**What it does:**
- Aggregates income and withholding from all uploaded documents
- Estimates 2024 federal tax liability using IRS brackets
- Identifies missed deductions (student loan interest, HSA, SE deductions, mortgage interest)
- Screens for applicable credits (CTC, EITC, Saver's Credit, education credits)
- Compares Married Filing Jointly vs. Separately scenarios

```python
from agents import AccountantAgent

accountant = AccountantAgent(db=db)
result = accountant.run("Prepare a tax summary for user abc123 who files as single.")
print(result["output"])
```

### Configuration

Both agents accept these constructor parameters:

| Parameter | Default | Description |
|---|---|---|
| `db` | required | Firestore client |
| `model` | `"gpt-4o-mini"` | OpenAI model name |
| `temperature` | `0.0` | Keep at 0 for deterministic tax analysis |
| `verbose` | `False` | Enable LangGraph debug step logging |
| `openai_api_key` | `None` | Falls back to `OPENAI_API_KEY` env var |

### Recommended workflow

Run the Auditor first to surface data quality issues, then the Accountant on clean data:

```python
audit  = auditor.run("Audit documents for user abc123")
# Fix any HIGH/ELEVATED findings, then:
prep   = accountant.run("Prepare a tax summary for user abc123, single filer")
```

## Testing

Tests cover all agent tools (tax calculations, audit triggers, Firestore queries) without requiring an OpenAI API key or live Firebase connection.

```bash
# Run all agent tests
python -m pytest agents/tests/ -v

# Run with coverage
coverage run -m pytest agents/tests/
coverage report
```

**81 tests, ~1.3s** — all tool business logic is unit-tested; LLM calls are mocked in smoke tests.

To run the existing Cloud Functions tests:

```bash
cd parser/functions
pytest test_main.py
```

## Key Components

### Parser Module (`parser/`)

Handles document ingestion via Firebase Cloud Functions. A Firestore trigger fires on every new `taxDocuments/{id}` write, downloads the file from Storage, runs OCR/PDF extraction, and writes the result back to `extractedData`.

### Task Queue (`queue/`)

Firestore-backed async task queue with priority levels (LOW → URGENT), retry logic with exponential backoff, and 5-minute default timeouts. Task types: `DOCUMENT_PROCESSING`, `FORM_GENERATION`, `AI_ANALYSIS`, `TAX_CALCULATION`.

### Tax Forms (`tax_forms/`)

Fills IRS forms (1040, W-2, Schedule C, etc.) programmatically and generates PDFs via ReportLab. Exposed as Flask routes for local dev and as Cloud Functions in production.

### Embedding / RAG (`embedding/`, `src/`)

Experimental vector search pipeline using FAISS + OpenAI embeddings (or Ollama locally). Powers semantic document search and the tax advisory chatbot.

## Dependencies

- **LangChain 1.x** + **LangGraph** — agent framework and tool-calling loop
- **langchain-openai** — OpenAI LLM integration
- **Firebase Admin SDK** — Firestore, Storage, Auth
- **Flask** — local development API server
- **PyPDF2 + Tesseract** — PDF and OCR document processing
- **ReportLab** — PDF generation for tax forms
- **FAISS** — local vector index for semantic search
- **Pandas** — data manipulation in form processing

## License

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fchenyuan99%2FTaxRAG.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fchenyuan99%2FTaxRAG?ref=badge_large)
