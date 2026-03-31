# Fundamento: Inmutabilidad de la Infraestructura. 
# Se define un SO (Sistema Operativo / Operating System) base estricto y predecible.
FROM python:3.10-slim

# Fundamento: Entorno de Trabajo (Working Directory).
# Aísla la ejecución del código del sistema de archivos raíz del contenedor.
WORKDIR /app

# Fundamento: Caché de Capas (Layer Caching).
# Se copian primero los requerimientos para que Docker almacene en caché las dependencias instaladas 
# y no las vuelva a descargar si solo cambias el código fuente.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Fundamento: Transferencia de Artefactos.
COPY . .

# Fundamento: Exposición de Puertos (Port Binding).
# Documenta el puerto en el que el proceso interno escuchará peticiones.
EXPOSE 5000

# Fundamento: Punto de Entrada (Entrypoint).
# Define el comando principal que mantiene vivo el contenedor.
CMD ["python", "app.py"]