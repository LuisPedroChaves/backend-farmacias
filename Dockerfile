# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig.json ./

# Instalar todas las dependencias (incluidas devDependencies para compilar TypeScript)
RUN npm ci --legacy-peer-deps

# Copiar el código fuente
COPY . .

# Compilar TypeScript a JavaScript
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev --legacy-peer-deps

# Copiar el código compilado desde el stage de build
COPY --from=builder /app/dist ./dist

# Crear directorios para uploads
RUN mkdir -p /app/dist/uploads/saleBalances \
    /app/dist/uploads/internalOrders \
    /app/dist/uploads/internalOrdersDispatch \
    /app/dist/uploads/products \
    /app/dist/uploads/purchases \
    /app/dist/uploads/accountsPayable \
    /app/dist/uploads/checkReceipts \
    /app/dist/uploads/banks

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "dist/index.js"]
