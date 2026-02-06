FROM n8nio/n8n:latest

# Instalar dependencias del sistema para OpenCV
RUN apt-get update && apt-get install -y \
    cmake \
    build-essential \
    pkg-config \
    python3 \
    python3-pip \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Node.js
WORKDIR /home/node/n8n-nodes-fatigue-detector

COPY package*.json ./
RUN npm install

# Copiar código fuente
COPY . .

# Compilar
RUN npm run build

# Copiar nodos compilados a n8n
RUN mkdir -p /home/node/.n8n/custom && \
    cp -r dist/* /home/node/.n8n/custom/

# Variables de entorno para cámara
ENV N8N_BASIC_AUTH_ACTIVE=true
ENV N8N_BASIC_AUTH_USER=admin
ENV N8N_BASIC_AUTH_PASSWORD=password

EXPOSE 5678

CMD ["n8n", "start"]
