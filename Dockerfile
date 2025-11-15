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

# Crear directorios para uploads en el directorio raíz de la app
# Esto permite que process.cwd() + '/uploads' funcione correctamente
RUN mkdir -p /app/uploads/saleBalances \
    /app/uploads/internalOrders \
    /app/uploads/products \
    /app/uploads/purchases \
    /app/uploads/accountsPayable \
    /app/uploads/checkReceipts \
    /app/uploads/banks \
    /app/uploads/temp \
    /app/uploads/employees \
    /app/uploads/vacation \
    /app/uploads/contractLaw \
    /app/uploads/internalContract \
    /app/uploads/confidentialityContract \
    /app/uploads/newContract \
    /app/uploads/cv

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "dist/index.js"]
