FROM node:22-alpine

WORKDIR /app

# Fundamento: Resolución de Dependencias.
COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3000

# Fundamento: Exposición de Host en Entornos Virtualizados.
# Vite por defecto solo escucha en localhost; '--host' permite que Docker mapee el puerto hacia afuera.
CMD ["npm", "run", "dev", "--", "--host"]