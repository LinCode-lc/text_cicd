FROM node:14-alpine as builder
ARG SECRET_ID
ARG SECRET_KEY
WORKDIR /code

# 单独分离 package.json，是为了安装依赖可最大限度利用缓存
ADD package.json package-lock.json /code/
RUN npm install


ADD . /code
RUN npm run build && npm run cos -- SECRET_ID $SECRET_ID SECRET_KEY $SECRET_KEY

# 选择更小体积的基础镜像
FROM nginx:alpine
ADD nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder code/build /usr/share/nginx/html