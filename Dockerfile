# Image size ~ 400MB
FROM node:21-alpine3.18 as builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate
ENV PNPM_HOME=/usr/local/bin

COPY . .

COPY package*.json *-lock.yaml ./

RUN apk add --no-cache --virtual .gyp \
        python3 \
        make \
        g++ \
    && apk add --no-cache git \
    && pnpm install \
    && apk del .gyp

FROM node:21-alpine3.18 as deploy

WORKDIR /app

ARG PORT
ENV PORT $PORT
EXPOSE $PORT

# COPY --from=builder /app/assets ./assets
# #COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/src ./src 
# COPY --from=builder /app/*.json /app/*-lock.yaml ./ /app/

COPY --from=builder /app .


RUN corepack enable && corepack prepare pnpm@latest --activate 
ENV PNPM_HOME=/usr/local/bin

RUN npm cache clean --force && pnpm install --production --ignore-scripts \
    && addgroup -g 1001 -S nodejs && adduser -S -u 1001 nodejs \
    && rm -rf $PNPM_HOME/.npm $PNPM_HOME/.node-gyp

# RUN cd node_modules/@builderbot/bot && pnpm install && npx tsc
# RUN cd node_modules/@builderbot/database-postgres && pnpm install && npx tsc
# RUN cd node_modules/@builderbot/provider-twilio && pnpm install && npx tsc



CMD ["npm", "start"]