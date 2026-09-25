FROM rocker/r-ver:4.6.1

WORKDIR /app

RUN R -e "options(repos='https://cloud.r-project.org'); install.packages(c('plumber', 'jsonlite', 'cors'), dependencies=TRUE)"
COPY . .

EXPOSE 10000

CMD ["R", "-e", "pr <- plumber::plumb('plumber.R'); pr$run(host='0.0.0.0', port=as.integer(Sys.getenv('PORT', '10000')))"]
