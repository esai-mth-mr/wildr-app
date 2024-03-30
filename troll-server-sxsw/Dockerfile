# TODO: Adopt https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md
# Adopted from https://gabnotes.org/lighten-your-python-image-docker-multi-stage-builds/
FROM python:3.8.13-slim-bullseye AS BUILD_IMAGE

ENV POETRY_VERSION=1.1.11
RUN pip3 install --no-cache-dir poetry==$POETRY_VERSION

WORKDIR /app
COPY pyproject.toml poetry.lock ./

RUN python -m venv --copies /app/.venv
RUN . /app/.venv/bin/activate && poetry install --no-dev --no-interaction

FROM python:3.8.13-slim-bullseye AS PROD_IMAGE

RUN apt-get update && apt-get install --assume-yes awscli

COPY --from=BUILD_IMAGE /app/.venv /app/.venv/
ENV PATH /app/.venv/bin:$PATH

WORKDIR /app
COPY . ./

# RUN pip3 install --no-cache-dir poetry==1.1.11 && poetry config virtualenvs.create false
# RUN poetry install --no-dev --no-interaction && poetry cache clear --all .

EXPOSE 7070
CMD ["./docker-entrypoint.sh"]
