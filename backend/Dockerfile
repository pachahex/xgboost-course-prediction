FROM python:3.10-slim

WORKDIR /app

# Fundamento: Compatibilidad de XGBoost con Contenedores.
#OJO, no se si sea completamente necesario
RUN apt-get update && apt-get install -y \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

TZ = 'America/La_Paz'

EXPOSE 5000

CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]