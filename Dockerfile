FROM jkris/mountebank
COPY . /imposters
ENTRYPOINT [ "/bin/sh","-c","mb --configfile /imposters/imposters.ejs --allowInjection" ]