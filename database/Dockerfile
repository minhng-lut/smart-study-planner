FROM postgres:16-alpine

LABEL description="Smart Study Planner database with pre-initialized schema"

COPY init.sql /docker-entrypoint-initdb.d/01-init.sql

ENV POSTGRES_DB=app
ENV POSTGRES_USER=app
ENV POSTGRES_PASSWORD=app

EXPOSE 5432