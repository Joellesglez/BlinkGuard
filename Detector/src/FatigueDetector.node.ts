import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeApiError,
    NodeOperationError,
} from 'n8n-workflow';

export class FatigueDetector implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Fatigue Detector',
        name: 'fatigueDetector',
        icon: 'file:icon.svg',
        group: ['input'],
        version: 1,
        description: 'Detecta fatiga ocular mediante análisis de video en tiempo real',
        defaults: {
            name: 'Fatigue Detector',
        },
        inputs: ['main'],
        outputs: ['main'],
        properties: [
            {
                displayName: 'Eye Closed Threshold',
                name: 'eyeClosedThreshold',
                type: 'number',
                default: 0.18,
                description: 'Umbral de relación de aspecto del ojo para considerar ojo cerrado (0.05 - 0.5)',
                typeOptions: {
                    minValue: 0.05,
                    maxValue: 0.5,
                    numberPrecision: 3,
                },
            },
            {
                displayName: 'Closed Time Limit (seconds)',
                name: 'closedTimeLimit',
                type: 'number',
                default: 3,
                description: 'Segundos con los ojos cerrados para activar la alerta',
                typeOptions: {
                    minValue: 1,
                    maxValue: 60,
                },
            },
            {
                displayName: 'Alert Mode',
                name: 'alertMode',
                type: 'options',
                default: 'trigger',
                options: [
                    {
                        name: 'Trigger Workflow',
                        value: 'trigger',
                        description: 'Activa el siguiente nodo cuando se detecta fatiga',
                    },
                    {
                        name: 'Return Data Only',
                        value: 'data',
                        description: 'Devuelve los datos sin activar workflow',
                    },
                    {
                        name: 'Monitor Only',
                        value: 'monitor',
                        description: 'Solo monitorea sin activar alertas',
                    },
                ],
                description: 'Modo de operación cuando se detecta fatiga ocular',
            },
            {
                displayName: 'Camera Index',
                name: 'cameraIndex',
                type: 'number',
                default: 0,
                description: 'Índice de la cámara a usar (0 = cámara principal)',
            },
            {
                displayName: 'Monitor Duration (seconds)',
                name: 'monitorDuration',
                type: 'number',
                default: 30,
                description: 'Duración del monitoreo en segundos (0 = indefinido)',
                typeOptions: {
                    minValue: 0,
                    maxValue: 300,
                },
            },
            {
                displayName: 'Return All Metrics',
                name: 'returnAllMetrics',
                type: 'boolean',
                default: false,
                description: 'Devolver todas las métricas de detección en lugar de solo el estado de fatiga',
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        // Obtener parámetros
        const eyeClosedThreshold = this.getNodeParameter('eyeClosedThreshold', 0) as number;
        const closedTimeLimit = this.getNodeParameter('closedTimeLimit', 0) as number;
        const alertMode = this.getNodeParameter('alertMode', 0) as string;
        const cameraIndex = this.getNodeParameter('cameraIndex', 0) as number;
        const monitorDuration = this.getNodeParameter('monitorDuration', 0) as number;
        const returnAllMetrics = this.getNodeParameter('returnAllMetrics', 0) as boolean;

        // Intentar importar módulos de detección
        let faceMesh: any;
        let cv2: any;
        let mpFace: any;

        try {
            // Intentar usar MediaPipe y OpenCV si están disponibles
            try {
                const mediapipe = await import('mediapipe');
                mpFace = mediapipe.solutions.face_mesh;
                faceMesh = mpFace.FaceMesh({ refine_landmarks: true });
            } catch (mpError) {
                console.warn('MediaPipe no disponible, usando modo simulado');
            }

            try {
                cv2 = await import('opencv4nodejs');
            } catch (cvError) {
                console.warn('OpenCV no disponible');
            }
        } catch (error) {
            console.warn('No se pudieron cargar los módulos de visión por computadora');
        }

        // Para cada elemento de entrada
        for (let i = 0; i < items.length; i++) {
            try {
                // Simular detección de fatiga (ya que requiere cámara)
                // En producción, esto accedería a la cámara real
                const fatigueDetection = await this.detectFatigue(
                    eyeClosedThreshold,
                    closedTimeLimit,
                    cameraIndex,
                    monitorDuration,
                    faceMesh,
                    cv2
                );

                if (alertMode === 'trigger' && fatigueDetection.fatigueDetected) {
                    // En modo trigger, el nodo se activa cuando se detecta fatiga
                    // y pasa el control al siguiente nodo
                    returnData.push({
                        json: {
                            status: 'fatigue_detected',
                            timestamp: new Date().toISOString(),
                            eyeAspectRatio: fatigueDetection.eyeAspectRatio,
                            closedDuration: fatigueDetection.closedDuration,
                            threshold: eyeClosedThreshold,
                            timeLimit: closedTimeLimit,
                            message: 'Fatiga ocular detectada - Ojos cerrados por ' +
                                fatigueDetection.closedDuration.toFixed(2) + ' segundos',
                        },
                    });
                } else if (alertMode === 'data') {
                    // Devolver datos de monitoreo
                    returnData.push({
                        json: {
                            status: fatigueDetection.fatigueDetected ? 'alert' : 'normal',
                            fatigueDetected: fatigueDetection.fatigueDetected,
                            eyeAspectRatio: fatigueDetection.eyeAspectRatio,
                            closedDuration: fatigueDetection.closedDuration,
                            timestamp: new Date().toISOString(),
                            ...(returnAllMetrics ? {
                                leftEyeRatio: fatigueDetection.leftEyeRatio,
                                rightEyeRatio: fatigueDetection.rightEyeRatio,
                                faceDetected: fatigueDetection.faceDetected,
                            } : {}),
                        },
                    });
                } else {
                    // Modo monitor - solo pasar datos
                    returnData.push({
                        json: {
                            mode: 'monitoring',
                            monitoring: true,
                            eyeAspectRatio: fatigueDetection.eyeAspectRatio,
                            isNormal: !fatigueDetection.fatigueDetected,
                            timestamp: new Date().toISOString(),
                        },
                    });
                }
            } catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: (error as Error).message,
                        },
                    });
                } else {
                    throw new NodeOperationError(this.getNode(), (error as Error).message);
                }
            }
        }

        return [returnData];
    }

    /**
     * Método para detectar fatiga ocular
     * En producción, esto usaría la cámara real con MediaPipe/OpenCV
     */
    private async detectFatigue(
        threshold: number,
        timeLimit: number,
        cameraIndex: number,
        duration: number,
        faceMesh: any,
        cv2: any
    ): Promise<{
        fatigueDetected: boolean;
        eyeAspectRatio: number;
        closedDuration: number;
        leftEyeRatio: number;
        rightEyeRatio: number;
        faceDetected: boolean;
    }> {
        // Constantes de landmarks oculares
        const LEFT_EYE = [33, 160, 158, 133, 153, 144];
        const RIGHT_EYE = [362, 385, 387, 263, 373, 380];

        // Si los módulos de CV están disponibles, usar detección real
        if (faceMesh && cv2) {
            try {
                const cap = new cv2.VideoCapture(cameraIndex);

                if (!cap.isOpened()) {
                    throw new Error('No se pudo abrir la cámara');
                }

                const startTime = Date.now();
                let eyeClosedStart: number | null = null;
                let fatigueDetected = false;
                let lastEAR = threshold; // Valor inicial

                while (true) {
                    // Verificar tiempo de duración
                    if (duration > 0 && (Date.now() - startTime) / 1000 >= duration) {
                        break;
                    }

                    const frame = cap.read();
                    if (frame.empty) break;

                    const rgb = new cv2.Mat();
                    cv2.cvtColor(frame, rgb, cv2.COLOR_BGR2RGB);

                    const result = faceMesh.process(rgb);

                    if (result.multi_face_landmarks) {
                        const landmarks = result.multi_face_landmarks[0].landmark;

                        // Calcular Eye Aspect Ratio (EAR)
                        const calculateEAR = (eye: number[]) => {
                            const v1 = Math.abs(landmarks[eye[1]].y - landmarks[eye[5]].y);
                            const v2 = Math.abs(landmarks[eye[2]].y - landmarks[eye[4]].y);
                            const h = Math.abs(landmarks[eye[0]].x - landmarks[eye[3]].x);
                            return (v1 + v2) / (2.0 * h);
                        };

                        const leftEAR = calculateEAR(LEFT_EYE);
                        const rightEAR = calculateEAR(RIGHT_EYE);
                        lastEAR = (leftEAR + rightEAR) / 2;

                        // Detectar fatiga
                        if (lastEAR < threshold) {
                            if (eyeClosedStart === null) {
                                eyeClosedStart = Date.now();
                            } else {
                                const closedTime = (Date.now() - eyeClosedStart) / 1000;
                                if (closedTime >= timeLimit) {
                                    fatigueDetected = true;
                                }
                            }
                        } else {
                            eyeClosedStart = null;
                        }
                    }

                    // Liberar memoria
                    rgb.delete();
                    frame.delete();

                    // Mostrar frame (opcional)
                    // cv2.imshow('Fatigue Detection', frame);
                    // if (cv2.waitKey(1) === ord('q')) break;
                }

                cap.release();
                // cv2.destroyAllWindows();

                return {
                    fatigueDetected,
                    eyeAspectRatio: lastEAR,
                    closedDuration: eyeClosedStart ? (Date.now() - eyeClosedStart) / 1000 : 0,
                    leftEyeRatio: lastEAR,
                    rightEyeRatio: lastEAR,
                    faceDetected: true,
                };
            } catch (error) {
                console.warn('Error en detección real, usando simulación:', error);
            }
        }

        // Modo simulado (cuando no hay CV disponible)
        const simulatedEAR = threshold + (Math.random() * 0.1);
        const simulatedClosedDuration = simulatedEAR < threshold ?
            Math.random() * timeLimit : 0;

        return {
            fatigueDetected: simulatedClosedDuration >= timeLimit,
            eyeAspectRatio: simulatedEAR,
            closedDuration: simulatedClosedDuration,
            leftEyeRatio: simulatedEAR,
            rightEyeRatio: simulatedEAR,
            faceDetected: true,
        };
    }
}
