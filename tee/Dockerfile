FROM python:3.10
### install python dependencies if you have some
COPY requirements.txt ./
RUN apt-get update 
### RUN apt-get install -y gcc 
RUN pip3 install --no-cache-dir --upgrade pip 
RUN pip3 install --no-cache-dir -r requirements.txt
COPY ./src /app
ENTRYPOINT ["python3", "/app/app.py"]