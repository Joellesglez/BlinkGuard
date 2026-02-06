import cv2
import time
import mediapipe as mp
import pygame
import os

EYE_CLOSED_THRESHOLD = 0.18  # Sensibilidad del ojo cerrado
CLOSED_TIME_LIMIT = 3        # Segundos para activar alarma


mp_face = mp.solutions.face_mesh
face_mesh = mp_face.FaceMesh(refine_landmarks=True)

# ----------------------------
# Inicializar Pygame para sonido
# ----------------------------
pygame.mixer.init()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ALERT_SOUND = os.path.join(BASE_DIR, "alert.wav")


cap = cv2.VideoCapture(0, cv2.CAP_AVFOUNDATION)  # macOS usa AVFoundation
if not cap.isOpened():
    print("No se pudo abrir la cámara. Revisa permisos de cámara en macOS.")
    exit()


eye_closed_start = None
alert_triggered = False


LEFT_EYE = [33, 160, 158, 133, 153, 144]
RIGHT_EYE = [362, 385, 387, 263, 373, 380]

def eye_ratio(landmarks, eye):
    vertical1 = abs(landmarks[eye[1]].y - landmarks[eye[5]].y)
    vertical2 = abs(landmarks[eye[2]].y - landmarks[eye[4]].y)
    horizontal = abs(landmarks[eye[0]].x - landmarks[eye[3]].x)
    return (vertical1 + vertical2) / (2.0 * horizontal)


print("Iniciando detección facial. Pulsa 'q' para salir.")
while True:
    ret, frame = cap.read()
    if not ret:
        print("No se pudo leer frame de la cámara.")
        break

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = face_mesh.process(rgb)

    if result.multi_face_landmarks:
        landmarks = result.multi_face_landmarks[0].landmark
        left_ear = eye_ratio(landmarks, LEFT_EYE)
        right_ear = eye_ratio(landmarks, RIGHT_EYE)
        ear = (left_ear + right_ear) / 2

        if ear < EYE_CLOSED_THRESHOLD:
            if eye_closed_start is None:
                eye_closed_start = time.time()
            elif time.time() - eye_closed_start >= CLOSED_TIME_LIMIT and not alert_triggered:
                # Reproducir alerta de manera segura
                if not pygame.mixer.music.get_busy():
                    pygame.mixer.music.load(ALERT_SOUND)
                    pygame.mixer.music.play()
                alert_triggered = True
        else:
            eye_closed_start = None
            alert_triggered = False

    
    cv2.imshow("Antigravity - Detección de ojos", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
pygame.mixer.quit()
