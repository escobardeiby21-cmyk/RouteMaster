# Usar la imagen oficial de Python ligera
FROM python:3.11-slim

# Evitar que Python escriba archivos .pyc en el disco
ENV PYTHONDONTWRITEBYTECODE 1
# Evitar que Python almacene en búfer los flujos de stdout y stderr
ENV PYTHONUNBUFFERED 1

# Establecer el directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema requeridas para herramientas matemáticas pesadas (Ortools, Scipy)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    libglib2.0-0 \
    libgomp1 \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Copiar el archivo de dependencias y ejecutarlas
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código del proyecto
COPY . .

# Exponer el puerto de Uvicorn (usualmente 8000 o proporcionado por la nube)
EXPOSE 8000

# Comando para iniciar la aplicación (Render asigna el puerto en la variable $PORT)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
