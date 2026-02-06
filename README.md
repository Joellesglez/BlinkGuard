# BlinkGuard

![BlinkGuard](https://img.shields.io/badge/status-Experimental-orange)

**BlinkGuard** es una aplicación de detección facial en tiempo real que monitorea el estado de los ojos. Si los ojos permanecen cerrados por más de 3 segundos, reproduce un **sonido de alerta** para avisar al usuario. Está diseñada para funcionar en **macOS** y ser ejecutada dentro del IDE **Antigravity**.

---

## Características

- Detección de rostro y ojos en tiempo real usando **MediaPipe Face Mesh**.  
- Alerta sonora con **Pygame**, estable y segura en **macOS**.
- Solo indica la alerta si los ojos están cerrados **≥ 3 segundos**.  
- Interfaz simple con cámara en vivo y ventana de visualización.  
- Compatible con entornos virtuales (`.venv`).  

---

## Capturas de pantalla

*(Opcional: añadir captura de la app mostrando la cámara y los rectángulos faciales)*

---

## Requisitos

- Python 3.9+  
- macOS (probado en M1/M2)  
- Cámara funcional y permisos otorgados a Python/Antigravity

---

# Instalación #

1. Clona el repositorio:

```bash
git clone https://github.com/tu_usuario/blinkguard.git
cd blinkguard

2. Crea un entorno virtual (opcional pero recomendado):

python3 -m venv .venv
source .venv/bin/activate

3. Instala dependencias:
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt

