# Imagen base
FROM node:22-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el código fuente
COPY . .

# Exponer el puerto (ajusta si tu app usa otro)
EXPOSE 3000

# Comando de inicio
CMD ["npm", "run", "dev"]
