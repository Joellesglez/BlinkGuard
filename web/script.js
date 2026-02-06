const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const statusEl = document.getElementById('status');
const timerEl = document.getElementById('timer');
const alertSound = document.getElementById('alert-sound');
const ctx = overlay.getContext('2d');

let eyeClosedStart = null;
const EYE_CLOSED_THRESHOLD = 0.25; // Ajusta la sensibilidad
const CLOSED_TIME_LIMIT = 3.0;     // Segundos para alarma

async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    video.srcObject = stream;
    return new Promise(resolve => {
        video.onloadedmetadata = () => resolve(video);
    });
}

async function loadModels() {
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.10.0/model/';
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
}

function getEAR(eye) {
    // Eye Aspect Ratio simple con puntos 36-41 (ojo izquierdo) o 42-47 (derecho)
    const vertical1 = Math.hypot(eye[1]._y - eye[5]._y, eye[1]._x - eye[5]._x);
    const vertical2 = Math.hypot(eye[2]._y - eye[4]._y, eye[2]._x - eye[4]._x);
    const horizontal = Math.hypot(eye[0]._y - eye[3]._y, eye[0]._x - eye[3]._x);
    return (vertical1 + vertical2) / (2.0 * horizontal);
}

async function detectLoop() {
    const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks(true);
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    if (detections) {
        const landmarks = detections.landmarks;

        // Dibuja la cara
        ctx.strokeStyle = 'rgba(31,60,136,0.6)';
        ctx.lineWidth = 2;
        const box = detections.detection.box;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Ojos
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        const ear = (getEAR(leftEye) + getEAR(rightEye)) / 2;

        if (ear < EYE_CLOSED_THRESHOLD) {
            if (!eyeClosedStart) eyeClosedStart = performance.now();
            const closedTime = (performance.now() - eyeClosedStart) / 1000;
            timerEl.textContent = closedTime.toFixed(1);

            if (closedTime >= CLOSED_TIME_LIMIT && alertSound.paused) {
                alertSound.play();
                statusEl.textContent = 'ALERTA: ojos cerrados';
                statusEl.style.color = 'red';
            }
        } else {
            eyeClosedStart = null;
            timerEl.textContent = '0.0';
            statusEl.textContent = 'Ojos abiertos';
            statusEl.style.color = '#1f3c88';
        }
    } else {
        statusEl.textContent = 'No se detecta cara';
        statusEl.style.color = '#555';
        timerEl.textContent = '0.0';
        eyeClosedStart = null;
    }

    requestAnimationFrame(detectLoop);
}

async function init() {
    await loadModels();
    await setupCamera();
    video.play();

    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;

    statusEl.textContent = 'Cámara lista';
    statusEl.style.color = '#1f3c88';

    detectLoop();
}

init();
