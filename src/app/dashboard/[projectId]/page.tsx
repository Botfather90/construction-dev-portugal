'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
    Building2,
    ArrowLeft,
    Map,
    FileText,
    Settings,
    UploadCloud,
    Trash2,
    Eye,
    MapPin,
    Ruler,
    Layers as LayersIcon,
    Calendar,
    X,
    Download,
    AlertTriangle,
} from 'lucide-react';
import { getProject, updateProject, deleteProject } from '@/lib/projects';
import { listDocuments, addDocument, deleteDocument, formatFileSize, getFileTypeIcon } from '@/lib/documents';
import { isAuthenticated } from '@/lib/auth';
import { Project, ProjectDocument } from '@/types';
import '@/styles/dashboard.css';

const PROJECT_TYPE_LABELS: Record<string, string> = {
    residential: 'Residential',
    commercial: 'Commercial',
    mixed: 'Mixed Use',
    industrial: 'Industrial',
    tourism: 'Tourism',
};

const STATUS_LABELS: Record<string, string> = {
    planning: 'Planning',
    design: 'Design',
    permitting: 'Permitting',
    construction: 'Construction',
    completed: 'Completed',
};

type Tab = 'overview' | 'map' | 'documents' | 'settings';

export default function ProjectDetailPage() {
    const router = useRouter();
    const params = useParams();
    const projectId = params.projectId as string;

    const [mounted, setMounted] = useState(false);
    const [project, setProject] = useState<Project | null>(null);
    const [documents, setDocuments] = useState<ProjectDocument[]>([]);
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [isDragging, setIsDragging] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
        if (!isAuthenticated()) { router.push('/auth'); return; }
        const p = getProject(projectId);
        if (!p) { router.push('/dashboard'); return; }
        setProject(p);
        setDocuments(listDocuments(projectId));
    }, [projectId, router]);

    const handleFileUpload = useCallback(async (files: FileList | null) => {
        if (!files || !project) return;
        for (const file of Array.from(files)) {
            try {
                const doc = await addDocument(project.id, file, 'other');
                setDocuments((prev) => [doc, ...prev]);
            } catch (err) {
                console.error('Failed to upload file:', err);
            }
        }
    }, [project]);

    const handleDeleteDocument = useCallback((docId: string) => {
        if (!project) return;
        deleteDocument(project.id, docId);
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
    }, [project]);

    const handleDeleteProject = useCallback(() => {
        if (!project) return;
        deleteProject(project.id);
        router.push('/dashboard');
    }, [project, router]);

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer.files); };

    if (!mounted || !project) return null;

    const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'overview', label: 'Overview', icon: <Building2 size={14} /> },
        { id: 'map', label: 'Map', icon: <Map size={14} /> },
        { id: 'documents', label: 'Documents', icon: <FileText size={14} /> },
        { id: 'settings', label: 'Settings', icon: <Settings size={14} /> },
    ];

    return (
        <div className="dashboard-layout">
            <div className="dashboard-topbar">
                <div className="dashboard-topbar-inner">
                    <Link href="/" className="dashboard-logo">
                        <div className="nav-logo-icon" style={{ width: 28, height: 28 }}>
                            <Building2 size={14} />
                        </div>
                        ConstruViz
                    </Link>
                    <div className="dashboard-topbar-nav">
                        <Link href="/map" className="dashboard-topbar-link">3D Map</Link>
                        <Link href="/dashboard" className="dashboard-topbar-link active">Projects</Link>
                    </div>
                </div>
            </div>

            <div className="project-detail">
                {/* Back + Header */}
                <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)', textDecoration: 'none' }}>
                    <ArrowLeft size={14} /> Back to Projects
                </Link>

                <div className="project-detail-header">
                    <div>
                        <h1>{project.name}</h1>
                        <div className="project-detail-meta">
                            <span className="badge badge-cyan">{PROJECT_TYPE_LABELS[project.projectType]}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <MapPin size={13} /> {project.address}
                            </span>
                            <span>{STATUS_LABELS[project.status]}</span>
                        </div>
                    </div>
                    <Link href="/map" className="btn btn-primary btn-sm">
                        <Map size={14} /> Open in Map
                    </Link>
                </div>

                {/* Tabs */}
                <div className="project-detail-tabs tabs">
                    {TABS.map((tab) => (
                        <button key={tab.id} className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="project-detail-content">
                    {activeTab === 'overview' && (
                        <div className="overview-grid">
                            <div className="overview-info-card glass">
                                <h3>Project Information</h3>
                                <div className="overview-info-row">
                                    <span className="overview-info-label">Type</span>
                                    <span className="overview-info-value">{PROJECT_TYPE_LABELS[project.projectType]}</span>
                                </div>
                                <div className="overview-info-row">
                                    <span className="overview-info-label">Status</span>
                                    <span className="overview-info-value">{STATUS_LABELS[project.status]}</span>
                                </div>
                                <div className="overview-info-row">
                                    <span className="overview-info-label">Address</span>
                                    <span className="overview-info-value">{project.address}</span>
                                </div>
                                {project.totalArea && (
                                    <div className="overview-info-row">
                                        <span className="overview-info-label">Total Area</span>
                                        <span className="overview-info-value">{project.totalArea.toLocaleString()} m{'\u00B2'}</span>
                                    </div>
                                )}
                                {project.floors && (
                                    <div className="overview-info-row">
                                        <span className="overview-info-label">Floors</span>
                                        <span className="overview-info-value">{project.floors}</span>
                                    </div>
                                )}
                                {project.units && (
                                    <div className="overview-info-row">
                                        <span className="overview-info-label">Units</span>
                                        <span className="overview-info-value">{project.units}</span>
                                    </div>
                                )}
                                <div className="overview-info-row">
                                    <span className="overview-info-label">Created</span>
                                    <span className="overview-info-value">{new Date(project.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="overview-info-card glass">
                                <h3>Quick Actions</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                                    <Link href="/map" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                                        <Map size={14} /> View on 3D Map
                                    </Link>
                                    <button className="btn btn-secondary" onClick={() => setActiveTab('documents')} style={{ justifyContent: 'flex-start' }}>
                                        <UploadCloud size={14} /> Upload Documents
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'map' && (
                        <div style={{ textAlign: 'center', padding: 'var(--space-16) var(--space-8)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border-subtle)' }}>
                            <Map size={48} style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)', opacity: 0.4 }} />
                            <h3 style={{ marginBottom: 'var(--space-2)' }}>3D Map View</h3>
                            <p style={{ color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-6)' }}>
                                View this project in the full 3D map with surrounding buildings and terrain.
                            </p>
                            <Link href="/map" className="btn btn-primary">
                                <Map size={14} /> Open Full Map
                            </Link>
                        </div>
                    )}

                    {activeTab === 'documents' && (
                        <div>
                            <input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple accept="image/*,application/pdf,.dwg,.dxf,.ifc" onChange={(e) => handleFileUpload(e.target.files)} />
                            <div className={`upload-zone ${isDragging ? 'dragging' : ''}`} onClick={() => fileInputRef.current?.click()} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                                <UploadCloud size={36} />
                                <h3>Upload Documents</h3>
                                <p>Drag and drop files here, or click to browse</p>
                                <div className="file-types">PDF, DWG, DXF, IFC, JPG, PNG</div>
                            </div>
                            {documents.length > 0 && (
                                <div className="doc-grid">
                                    {documents.map((doc) => (
                                        <div key={doc.id} className="doc-card">
                                            <div className="doc-card-icon">{getFileTypeIcon(doc.fileType)}</div>
                                            <div className="doc-card-name">{doc.name}</div>
                                            <div className="doc-card-meta">
                                                <span>{formatFileSize(doc.fileSize)}</span>
                                                <span style={{ display: 'flex', gap: '8px' }}>
                                                    {doc.dataUrl && (
                                                        <button onClick={() => window.open(doc.dataUrl, '_blank')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent-cyan)', padding: 0 }}>
                                                            <Eye size={14} />
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleDeleteDocument(doc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent-rose)', padding: 0 }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div style={{ maxWidth: 600 }}>
                            <div className="overview-info-card glass" style={{ marginBottom: 'var(--space-8)' }}>
                                <h3>Project Settings</h3>
                                <div className="overview-info-row">
                                    <span className="overview-info-label">Project ID</span>
                                    <span className="overview-info-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{project.id}</span>
                                </div>
                                <div className="overview-info-row">
                                    <span className="overview-info-label">Last Updated</span>
                                    <span className="overview-info-value">{new Date(project.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div style={{ padding: 'var(--space-6)', background: 'rgba(244, 63, 94, 0.06)', border: '1px solid rgba(244, 63, 94, 0.15)', borderRadius: 'var(--radius-lg)' }}>
                                <h3 style={{ color: 'var(--color-accent-rose)', fontSize: 'var(--text-base)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertTriangle size={16} /> Danger Zone
                                </h3>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-4)' }}>
                                    Permanently delete this project and all associated documents.
                                </p>
                                {showDeleteConfirm ? (
                                    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                                        <button className="btn btn-danger" onClick={handleDeleteProject}>
                                            <Trash2 size={14} /> Yes, Delete Project
                                        </button>
                                        <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                                    </div>
                                ) : (
                                    <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>
                                        <Trash2 size={14} /> Delete Project
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
