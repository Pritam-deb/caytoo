# db-processor/Dockerfile
# FROM node:20

# WORKDIR /app
# COPY . .
# RUN npm install


# CMD ["npm", "run", "dev"]

# ============= old Dockerfile =============
FROM node:20

WORKDIR /app
COPY package*.json ./
RUN npm install --include=dev
COPY . .
RUN npx prisma generate
CMD sh -c "npx prisma migrate deploy && npm run dev"