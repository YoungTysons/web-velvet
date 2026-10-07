FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm install

# Copy toàn bộ mã nguồn
COPY . .

# Generate Prisma Client với đường dẫn schema chuẩn trong dự án của bạn
RUN npx prisma generate

EXPOSE 8080

CMD ["npm", "start"]