FROM golang:1.15-alpine
RUN apk add build-base
RUN apk add python3
RUN apk --no-cache add -t .build-deps \
        gcc \
        libc-dev\
        make \
        libpng-dev \
        g++ \
        git && \
    mkdir -p /opt/google && \
    cd /opt/google && \
    git clone https://github.com/google/guetzli.git && \
    cd guetzli && \
    make && \
    cd /opt  && \
    mv /opt/google/guetzli/bin/Release/guetzli . && \
    rm -fr /opt/google && \
    apk --no-cache add libpng libstdc++ && \
    apk -- del .build-deps
WORKDIR /go/src/github.com/arideno/gogame
COPY . .
RUN go get -v ./
EXPOSE 8080