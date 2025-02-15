# Build stage
FROM python:3.9-slim as build

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY requirements.txt .
COPY parser/functions/requirements.txt ./parser-requirements.txt
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir -r parser-requirements.txt

# Production stage
FROM python:3.9-slim

# Install Chrome and its dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg2 \
    apt-transport-https \
    ca-certificates \
    curl \
    unzip \
    chromium \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1001 appuser && \
    useradd -u 1001 -g appuser -s /bin/bash appuser

WORKDIR /app

# Copy virtual environment from build stage
COPY --from=build /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install additional Python packages for browser automation
RUN pip install --no-cache-dir \
    selenium==4.15.2 \
    webdriver-manager==4.0.1 \
    playwright==1.40.0

# Install Playwright browsers
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/playwright
RUN playwright install chromium && \
    playwright install-deps chromium

# Copy application code
COPY --chown=appuser:appuser . .

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    FLASK_APP=app.py \
    FLASK_ENV=production \
    PORT=5000 \
    # Chrome/Selenium related environment variables
    CHROME_BIN=/usr/bin/chromium \
    CHROMEDRIVER_PATH=/usr/bin/chromedriver \
    DISPLAY=:99 \
    # Playwright related environment variables
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Give appuser access to required directories
RUN mkdir -p /app/data /app/downloads /app/temp && \
    chown -R appuser:appuser /app /opt/playwright && \
    chmod -R 755 /app /opt/playwright

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl --fail http://localhost:5000/health || exit 1

# Expose port
EXPOSE 5000

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--threads", "2", "--timeout", "60", "app:app"]
