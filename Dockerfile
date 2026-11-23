# 软件大全 —— 后端服务镜像
# 仅使用 Python 标准库，无需安装任何第三方依赖，构建时不联网
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DATA_DIR=/app/data \
    PORT=8080

WORKDIR /app

COPY app ./app

RUN mkdir -p /app/data/uploads

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8080/api/health', timeout=3).status==200 else 1)" || exit 1

CMD ["python", "-u", "app/server.py"]
