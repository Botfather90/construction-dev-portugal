// ConstruViz — Document helpers (localStorage for MVP)

import { ProjectDocument, DocumentFileType, DocumentCategory } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const storageKey = (projectId: string) => `construviz_docs_${projectId}`;

function getDocs(projectId: string): ProjectDocument[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(storageKey(projectId));
    return data ? JSON.parse(data) : [];
}

function saveDocs(projectId: string, docs: ProjectDocument[]): void {
    localStorage.setItem(storageKey(projectId), JSON.stringify(docs));
}

export function listDocuments(projectId: string): ProjectDocument[] {
    return getDocs(projectId).sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
}

export function getDocument(
    projectId: string,
    docId: string
): ProjectDocument | undefined {
    return getDocs(projectId).find((d) => d.id === docId);
}

export function addDocument(
    projectId: string,
    file: File,
    category: DocumentCategory = 'other'
): Promise<ProjectDocument> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const doc: ProjectDocument = {
                id: uuidv4(),
                projectId,
                name: file.name.replace(/\.[^/.]+$/, ''),
                fileName: file.name,
                fileType: getFileType(file.name),
                fileSize: file.size,
                mimeType: file.type || 'application/octet-stream',
                dataUrl: reader.result as string,
                category,
                uploadedAt: new Date().toISOString(),
                version: 1,
            };
            const docs = getDocs(projectId);
            docs.push(doc);
            saveDocs(projectId, docs);
            resolve(doc);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

export function deleteDocument(projectId: string, docId: string): boolean {
    const docs = getDocs(projectId);
    const filtered = docs.filter((d) => d.id !== docId);
    if (filtered.length === docs.length) return false;
    saveDocs(projectId, filtered);
    return true;
}

export function getFileType(fileName: string): DocumentFileType {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'pdf': return 'pdf';
        case 'dwg': return 'dwg';
        case 'dxf': return 'dxf';
        case 'ifc': return 'ifc';
        case 'jpg':
        case 'jpeg': return 'jpg';
        case 'png': return 'png';
        default: return 'other';
    }
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getFileTypeIcon(type: DocumentFileType): string {
    switch (type) {
        case 'pdf': return 'PDF';
        case 'dwg':
        case 'dxf': return 'CAD';
        case 'ifc': return 'BIM';
        case 'jpg':
        case 'png': return 'IMG';
        default: return 'DOC';
    }
}

export const ACCEPTED_FILE_TYPES = {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'application/octet-stream': ['.dwg', '.dxf', '.ifc'],
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
