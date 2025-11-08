#Base image
FROM nginx:1.27.0

# apt package update && Install vim editor
RUN apt-get update
RUN apt-get install -y vim

# /usr/share/nginx/html is the default location for static files in nginx image
COPY ./index.html /usr/share/nginx/html/index.html

# Setting file permissons to user and group to nginx
RUN chown nginx:nginx /usr/share/nginx/html/index.html