FROM node:20 as build
WORKDIR /app

# 💡 핵심: 별표(*)를 빼서 package.json만 복사하게 만듦! (리눅스용으로 재설치 유도)
COPY package.json ./
RUN npm install

COPY . .
RUN npm run build 

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]