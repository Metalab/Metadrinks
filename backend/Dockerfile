FROM golang:alpine AS builder

WORKDIR /app
COPY . .

RUN go build -o main .

FROM alpine
RUN apk add --no-cache tzdata
COPY --from=builder /app/main ./main
CMD ["./main"]