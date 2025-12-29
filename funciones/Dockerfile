FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install --production
EXPOSE 3000
CMD ["sh", "-c", "node fog${FOG_ID}.js"]
