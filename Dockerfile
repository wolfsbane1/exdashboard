FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_EXDASH_API_URL=/api/exdash
ENV VITE_EXDASH_API_URL=${VITE_EXDASH_API_URL}

RUN npm run build

ENV NODE_ENV=production
ENV PORT=4000
ENV SERVE_STATIC=true
ENV TRUST_PROXY=true

EXPOSE 4000

CMD ["npm", "run", "start"]
