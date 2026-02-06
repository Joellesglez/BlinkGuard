
## Características

- **Detección de fatiga ocular**: Monitorea el Eye Aspect Ratio (EAR) para detectar ojos cerrados
- **Alertas configurables**: Define umbrales de sensibilidad y tiempo de alerta
- **Múltiples modos de operación**:
  - Trigger: Activa el siguiente nodo cuando se detecta fatiga
  - Data: Devuelve datos de monitoreo
  - Monitor: Solo monitorea sin activar alertas
- **Métricas detalladas**: Ratio de aspecto de ambos ojos, duración del cierre, etc.

## Requisitos previos

- Node.js >= 18.0.0
- n8n (versión self-hosted)
- CMake (para compilar opencv4nodejs)
- Python 3.x (para dependencias nativas)

## Instalación

### 1. Clonar e instalar dependencias

```bash
cd n8n-nodes-fatigue-detector
npm install
```

### 2. Compilar el proyecto

```bash
npm run build
```

### 3. Instalar en n8n

```bash
# Opción A: Enlace simbólico (desarrollo)
cd ~/.n8n/custom
ln -s /ruta/a/n8n-nodes-fatigue-detector

# Opción B: Copiar archivos compilados
cp -r dist/* ~/.n8n/custom/
```

### 4. Reiniciar n8n

```bash
# Reinicia tu instancia de n8n
```

## Uso en n8n

### Configuración del nodo

1. Arrastra el nodo "Fatigue Detector" a tu workflow
2. Configura los parámetros:

| Parámetro | Descripción | Valor por defecto |
|-----------|-------------|-------------------|
| Eye Closed Threshold | Umbral de relación de aspecto del ojo cerrado | 0.18 |
| Closed Time Limit | Segundos con ojos cerrados para activar alerta | 3 |
| Alert Mode | Modo de operación | Trigger |
| Camera Index | Índice de la cámara | 0 |
| Monitor Duration | Duración del monitoreo en segundos | 30 |
| Return All Metrics | Devolver todas las métricas | false |

### Ejemplo de Workflow

```
[Webhook] → [Fatigue Detector] → [IF fatigueDetected] → [Send Slack Alert]
                                    ↓
                              [Continue Normal]
```

### Salida del nodo

```json
{
  "status": "alert",
  "fatigueDetected": true,
  "eyeAspectRatio": 0.15,
  "closedDuration": 3.5,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "leftEyeRatio": 0.14,
  "rightEyeRatio": 0.16,
  "faceDetected": true
}
```

## Uso con Docker

Si usas n8n en Docker:

```bash
# Construir la imagen personalizada
docker build -t n8n-fatigue-detector .

# Ejecutar
docker run -it -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8n-fatigue-detector
```

## Desarrollo

### Comandos disponibles

```bash
# Desarrollo con watch
npm run dev

# Linting
npm run lint

# Tests
npm run test

# Ver watch mode
npm run test:watch
```

### Estructura del proyecto

```
n8n-nodes-fatigue-detector/
├── src/
│   ├── FatigueDetector.node.ts   # Implementación del nodo
│   └── index.ts                   # Punto de entrada
├── package.json                   # Dependencias y metadatos
├── tsconfig.json                  # Configuración TypeScript
└── README.md                      # Documentación
```

## Problemas conocidos

1. **OpenCV no compila**: Asegúrate de tener CMake instalado:
   ```bash
   # macOS
   brew install cmake
   
   # Ubuntu/Debian
   sudo apt-get install cmake build-essential
   
   # Windows
   choco install cmake
   ```

2. **Camera access denied**: En Linux, añade tu usuario al grupo video:
   ```bash
   sudo usermod -aG video $USER
   ```

## Licencia

MIT
