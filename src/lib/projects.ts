// ConstruViz — Project CRUD (localStorage for MVP)

import { Project } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'construviz_projects';

function getProjects(): Project[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveProjects(projects: Project[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function listProjects(): Project[] {
    return getProjects().sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}

export function getProject(id: string): Project | undefined {
    return getProjects().find((p) => p.id === id);
}

export function createProject(
    data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
): Project {
    const now = new Date().toISOString();
    const project: Project = {
        ...data,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
    };
    const projects = getProjects();
    projects.push(project);
    saveProjects(projects);
    return project;
}

export function updateProject(
    id: string,
    data: Partial<Omit<Project, 'id' | 'createdAt'>>
): Project | undefined {
    const projects = getProjects();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) return undefined;
    projects[index] = {
        ...projects[index],
        ...data,
        updatedAt: new Date().toISOString(),
    };
    saveProjects(projects);
    return projects[index];
}

export function deleteProject(id: string): boolean {
    const projects = getProjects();
    const filtered = projects.filter((p) => p.id !== id);
    if (filtered.length === projects.length) return false;
    saveProjects(filtered);
    // Also delete associated documents
    if (typeof window !== 'undefined') {
        localStorage.removeItem(`construviz_docs_${id}`);
    }
    return true;
}

// Demo projects for first launch
export function seedDemoProjects(): void {
    if (getProjects().length > 0) return;

    const demos: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
            name: 'Residências da Estrela',
            description: 'Luxury residential development in the heart of Estrela, Lisbon. 24 premium apartments with rooftop terraces and private gardens.',
            address: 'Rua da Estrela 42, 1200-669 Lisboa',
            latitude: 38.7118,
            longitude: -9.1605,
            projectType: 'residential',
            status: 'design',
            totalArea: 4200,
            floors: 6,
            units: 24,
        },
        {
            name: 'Porto Innovation Hub',
            description: 'Mixed-use commercial and co-working space in Porto\'s Bonfim district. Modern architecture blending with traditional Porto facades.',
            address: 'Rua do Bonfim 218, 4300-066 Porto',
            latitude: 41.1521,
            longitude: -8.5963,
            projectType: 'commercial',
            status: 'permitting',
            totalArea: 8500,
            floors: 4,
            units: 12,
        },
        {
            name: 'Algarve Beach Resort',
            description: 'Tourism resort with 48 suites and wellness center. Sustainable design with solar integration and native landscaping.',
            address: 'Praia da Falésia, Albufeira',
            latitude: 37.0893,
            longitude: -8.1697,
            projectType: 'tourism',
            status: 'planning',
            totalArea: 12000,
            floors: 3,
            units: 48,
        },
    ];

    demos.forEach((d) => createProject(d));
}
