FROM node:22-trixie-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 10000
CMD ["npm", "start"]
