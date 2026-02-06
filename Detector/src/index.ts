import { INodeType, INodeTypeDescription } from 'n8n-workflow';
import { FatigueDetector } from './FatigueDetector.node';

export { FatigueDetector };

export async function loadPackage(): Promise<void> {
    // Función de carga del paquete
}

export const nodeTypes: { [key: string]: INodeType | INodeTypeDescription } = {
    fatigueDetector: new FatigueDetector(),
};
