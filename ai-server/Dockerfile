# Use the official Python base image since it is much faster then Alpine or Debian
FROM python:3.11

# Set the working directory inside the container
WORKDIR /app

# Install Poetry
RUN pip install --no-cache-dir poetry==1.5.1

# Copy the project files to the working directory
COPY pyproject.toml poetry.lock /app/

# Install project dependencies
RUN poetry install --no-root --no-dev

# Copy the application code to the working directory
COPY ./app ./app

# Expose the port on which the FastAPI app will run
EXPOSE 8000

# Start the FastAPI app with Uvicorn
CMD ["poetry", "run", "uvicorn", "app.main:app", "--port", "8000"]
