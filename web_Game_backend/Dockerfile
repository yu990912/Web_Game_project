# 1. 가벼운 Node.js 환경 가져오기
FROM node:18-alpine

# 2. 작업할 폴더 지정
WORKDIR /app

# 3. 패키지 파일 먼저 복사하고 설치 (캐시 최적화)
COPY package*.json ./
RUN npm install

# 4. 나머지 모든 코드 복사
COPY . .

# 5. 서버 포트 8080 열어주기
EXPOSE 8080

# 6. 컨테이너 켜질 때 실행할 명령어
CMD ["node", "server.js"]