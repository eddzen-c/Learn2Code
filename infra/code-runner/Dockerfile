FROM node:24-alpine

WORKDIR /runner

COPY --chown=root:root runner.cjs /runner/runner.cjs

USER node

ENTRYPOINT ["node", "/runner/runner.cjs"]