# # news-worker/Dockerfile
# FROM python:3.10

# WORKDIR /app
# COPY requirements.txt .
# # RUN pip install -r requirements.txt
# RUN pip install --no-cache-dir --upgrade -r requirements.txt
# COPY . .
# EXPOSE 8000
# CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
# # CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
# # CMD ["fastapi", "dev", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]

# ============= old Dockerfile =============
# news-worker/Dockerfile
FROM python:3.10

# Environment variables to improve Python behavior inside Docker
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Install dependencies first (leverages Docker layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir --upgrade -r requirements.txt

# Copy the application code
COPY . .

# Expose the port used by uvicorn
EXPOSE 8000

# Start the FastAPI app with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]