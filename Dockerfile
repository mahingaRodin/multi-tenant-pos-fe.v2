FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build \
    && mkdir -p /out \
    && if [ -d dist/client ]; then cp -a dist/client/. /out/; \
       elif [ -d dist/public ]; then cp -a dist/public/. /out/; \
       elif [ -d .output/public ]; then cp -a .output/public/. /out/; \
       elif [ -f dist/index.html ]; then cp -a dist/. /out/; \
       else echo "Build produced no static assets" && find . -maxdepth 3 -name index.html && exit 1; \
       fi

FROM nginx:1.27-alpine
COPY --from=builder /out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
CMD ["nginx", "-g", "daemon off;"]
