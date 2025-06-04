# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Create necessary directories if they don't exist
RUN mkdir -p logs uploads

# Verifica se o MongoDB está online antes de iniciar
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Define o entrypoint para iniciar o serviço
ENTRYPOINT ["./entrypoint.sh"]

# Para modo de desenvolvimento/debug, use:
CMD ["python", "api_server.py"]
