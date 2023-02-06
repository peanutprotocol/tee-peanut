FROM python:3.7.3-alpine3.10

### install python dependencies if you have some
RUN pip3 install pyfiglet

COPY ./src /app

ENTRYPOINT ["python3", "/app/app.py"]