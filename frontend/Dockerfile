FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

# Cần cờ --host để Vite lắng nghe kết nối từ bên ngoài container Docker
CMD ["npm", "run", "dev", "--", "--host"]
