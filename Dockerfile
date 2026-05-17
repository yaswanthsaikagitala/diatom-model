# Use Python base image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

COPY app.py .
COPY diatom_model.keras .
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose port
EXPOSE 8000

# Run backend (FIXED)
CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]