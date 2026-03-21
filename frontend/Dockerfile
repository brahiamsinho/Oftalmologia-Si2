FROM node:20-alpine

WORKDIR /app

# Instalar dependencias
COPY package.json package-lock.json* ./
RUN npm install

# Copiar código fuente
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
