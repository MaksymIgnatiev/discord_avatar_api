FROM oven/bun:latest

WORKDIR /app

COPY . .

RUN bun install

EXPOSE 7352

CMD ["bun", "run", "start"]

