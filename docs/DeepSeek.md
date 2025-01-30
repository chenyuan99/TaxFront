# Running DeepSeek-R1 Locally with Ollama and Docker

DeepSeek-R1 is an advanced reasoning model designed for tasks involving mathematics, coding, and logic. This guide will walk you through setting up and running DeepSeek-R1 locally using Ollama and Docker.

## Prerequisites

- **Operating System**: Windows, macOS, or Linux
- **Hardware**: A system with at least 8GB RAM; no dedicated GPU required
- **Software**:
  - [Docker Desktop](https://www.docker.com/)
  - [Ollama](https://ollama.com/)

## Step 1: Install Docker

1. **Download Docker Desktop**:
   - Visit the [Docker official website](https://www.docker.com/products/docker-desktop) and download the installer suitable for your operating system.

2. **Install Docker Desktop**:
   - Run the installer and follow the on-screen instructions to complete the installation.

3. **Verify Installation**:
   - Open a terminal or command prompt and run:
     ```bash
     docker --version
     ```
   - You should see the Docker version information, confirming a successful installation.

## Step 2: Set Up Open WebUI

Open WebUI provides a user-friendly interface to interact with AI models like DeepSeek-R1.

1. **Pull the Open WebUI Docker Image**:
   - In the terminal, execute:
     ```bash
     docker pull ghcr.io/open-webui/open-webui:main
     ```

2. **Run the Open WebUI Container**:
   - Start the container with the following command:
     ```bash
     docker run -d -p 9783:8080 -v open-webui:/app/backend/data --name open-webui ghcr.io/open-webui/open-webui:main
     ```
   - This command does the following:
     - `-d`: Runs the container in detached mode.
     - `-p 9783:8080`: Maps port 8080 in the container to port 9783 on your host machine.
     - `-v open-webui:/app/backend/data`: Creates a named volume `open-webui` for persistent data storage.
     - `--name open-webui`: Names the container `open-webui`.

3. **Access Open WebUI**:
   - Open your browser and navigate to [http://localhost:9783/](http://localhost:9783/).
   - Create an account when prompted to access the main chat interface.

## Step 3: Install Ollama

Ollama is a framework that facilitates the local execution of AI models.

1. **Download and Install Ollama**:
   - Visit the [Ollama website](https://ollama.com/) and follow the installation instructions for your operating system.

2. **Verify Installation**:
   - Open a terminal and run:
     ```bash
     ollama --version
     ```
   - You should see the Ollama version information, confirming a successful installation.

## Step 4: Download the DeepSeek-R1 Model

1. **Run the DeepSeek-R1 Model**:
   - In the terminal, execute:
     ```bash
     ollama run deepseek-r1:8b
     ```
   - This command downloads and runs the 8-billion parameter version of the DeepSeek-R1 model.

## Step 5: Integrate Ollama with Open WebUI

1. **Refresh Open WebUI**:
   - Go back to the Open WebUI interface in your browser and refresh the page.

2. **Select the DeepSeek-R1 Model**:
   - In the model selection dropdown, choose `deepseek-r1:8b`.

3. **Start Interacting**:
   - You can now interact with the DeepSeek-R1 model through the Open WebUI interface.

## Conclusion

By following these steps, you've set up DeepSeek-R1 locally using Ollama and Docker. This setup allows you to leverage advanced reasoning capabilities without relying on cloud-based services, ensuring both privacy and efficiency.

For a visual walkthrough, you might find this video helpful:

[![DeepSeek-R1 Setup in 2 Minutes](https://img.youtube.com/vi/TpNwYA8Eqhk/0.jpg)](https://www.youtube.com/watch?v=TpNwYA8Eqhk)

*DeepSeek-R1 Setup in 2 Minutes: Run This Insane Open-Source Model Locally*

*Note: This guide is based on information available as of January 28, 2025. For the latest updates and support, refer to the official documentation of the respective tools.*