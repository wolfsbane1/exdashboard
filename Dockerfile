FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN unset NPM_TOKEN NODE_AUTH_TOKEN \
  && npm config set registry https://registry.npmjs.org/ \
  && npm config delete //registry.npmjs.org/:_authToken || true \
  && npm config delete _authToken || true \
  && npm ci --registry=https://registry.npmjs.org/

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
