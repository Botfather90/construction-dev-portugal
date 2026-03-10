'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
    Building2,
    ArrowLeft,
    Map,
    MapPin,
    FileText,
    Settings,
    Upload,
    LayoutDashboard,
    Trash2,
    Eye,
    X,
    Clock,
    Layers,
    Building,
    Hotel,
    Factory,
    Home as HomeIcon,
    Store,
    Download,
    ChevronRight,
} from 'lucide-react';
import { getProject, deleteProject, updateProject } from '@/lib/projects';
import { listDocuments, addDocument, deleteDocument, formatFileSize, getFileTypeIcon } from '@/lib/documents';
import type { Project, ProjectDocument, DocumentCategory } from '@/types';
import '@/styles/dashboard.css';

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
    planning: { label: 'Planning', className: 'badge-violet' },
    design: { label: 'Design', className: 'badge-cyan' },
    permitting: { label: 'Permitting', className: 'badge-amber' },
    construction: { label: 'Construction', className: 'badge-emerald' },
    completed: { label: 'Completed', className: 'badge-emerald' },
};

const TYPE_LABELS: Record<string, string> = {
    residential: '🏠 Residential',
    commercial: '🏢 Commercial',
    mixed: '🏗️ Mixed Use',
    industrial: '🏭 Industrial',
    tourism: '🏨 Tourism',
};

const TABS = [
    { id: 'overview', label: 'Overview', icon: <Layers size={14} /> },
    { id: 'map', label: 'Map View', icon: <Map size={14} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={14} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={14} /> },
];

export default function ProjectDetailPage() {
    const router = useRouter();
    const params = useParams();
    const projectId = params.projectId as string;

    const [project, setProject] = useState<Project | null>(null);
    const [documents, setDocuments] = useState<ProjectDocument[]>([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [viewingDoc, setViewingDoc] = useState<ProjectDocument | null>(null);
    const [mounted, setMounted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
        const p = getProject(projectId);
        if (p) {
            setProject(p);
            setDocuments(listDocuments(projectId));
        }
    }, [projectId]);

    const handleFileDrop = useCallback(
        async (files: FileList | File[]) => {
            setUploading(true);
            const fileArray = Array.from(files);
            for (const file of fileArray) {
                try {
                    await addDocument(projectId, file);
                } catch (err) {
                    console.error('Upload failed:', err);
                }
            }
            setDocuments(listDocuments(projectId));
            setUploading(false);
            setDragging(false);
        },
        [projectId]
    );

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => setDragging(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        handleFileDrop(e.dataTransfer.files);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) handleFileDrop(e.target.files);
    };

    const handleDeleteDoc = (docId: string) => {
        deleteDocument(projectId, docId);
        setDocuments(listDocuments(projectId));
        setViewingDoc(null);
    };

    const handleDeleteProject = () => {
        if (confirm('Are you sure you want to delete this project? This cannot be undone.')) {
            deleteProject(projectId);
            router.push('/dashboard');
        }
    };

    if (!mounted) return null;

    if (!project) {
        return (
            <div className="dashboard-layout">
                <div className="dashboard-content">
                    <div className="empty-state">
                        <Building2 size={64} />
                        <h3>Project Not Found</h3>
                        <p>The project you&apos;re looking for doesn&apos;t exist.</p>
                        <Link href="/dashboard" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
                            <ArrowLeft size={16} /> Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            {/* Top Bar */}
            <div className="dashboard-topbar">
                <div className="dashboard-topbar-inner">
                    <Link href="/" className="dashboard-logo">
                        <span style={{
                            width: 28, height: 28, background: 'var(--gradient-primary)',
                            borderRadius: 'var(--radius-sm)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Building2 size={16} color="white" />
                        </span>
                        ConstruViz
                    </Link>
                    <div className="dashboard-topbar-nav hide-mobile">
                        <Link href="/dashboard" className="dashboard-topbar-link active">
                            <LayoutDashboard size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                            Dashboard
                        </Link>
                        <Link href="/map" className="dashboard-topbar-link">
                            <Map size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                            3D Map
                        </Link>
                    </div>
                    <Link href="/map" className="btn btn-sm btn-primary">
                        <Map size={14} /> Open Map
                    </Link>
                </div>
            </div>

            {/* Project Content */}
            <div className="project-detail">
                {/* Back + Header */}
                <Link
                    href="/dashboard"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
                        fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)',
                        marginBottom: 'var(--space-4)', textDecoration: 'none',
                    }}
                >
                    <ArrowLeft size={14} />
                    Back to Projects
                </Link>

                <div className="project-detail-header">
                    <div>
                        <h1>{project.name}</h1>
                        <div className="project-detail-meta">
                            <span className={`badge ${STATUS_BADGES[project.status]?.className}`}>
                                {STATUS_BADGES[project.status]?.label}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                <MapPin size={14} /> {project.address || 'No address'}
                            </span>
                            <span>{TYPE_LABELS[project.projectType]}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <Link
                            href={`/map`}
                            className="btn btn-secondary btn-sm"
                        >
                            <Map size={14} /> View on Map
                        </Link>
                    </div>
                </div>

                {/* Tabs */}
                <div className="project-detail-tabs">
                    <div className="tabs">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.icon}
                                <span style={{ marginLeft: 4 }}>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="project-detail-content">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="overview-grid animate-fade-in">
                            <div>
                                <div className="overview-info-card" style={{ marginBottom: 'var(--space-6)' }}>
                                    <h3>Project Description</h3>
                                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)' }}>
                                        {project.description || 'No description yet.'}
                                    </p>
                                </div>
                                <div className="overview-info-card">
                                    <h3>Project Details</h3>
                                    <div className="overview-info-row">
                                        <span className="overview-info-label">Status</span>
                                        <span className={`badge ${STATUS_BADGES[project.status]?.className}`}>
                                            {STATUS_BADGES[project.status]?.label}
                                        </span>
                                    </div>
                                    <div className="overview-info-row">
                                        <span className="overview-info-label">Type</span>
                                        <span className="overview-info-value">{TYPE_LABELS[project.projectType]}</span>
                                    </div>
                                    <div className="overview-info-row">
                                        <span className="overview-info-label">Address</span>
                                        <span className="overview-info-value">{project.address || '—'}</span>
                                    </div>
                                    <div className="overview-info-row">
                                        <span className="overview-info-label">Coordinates</span>
                                        <span className="overview-info-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                                            {project.latitude.toFixed(4)}, {project.longitude.toFixed(4)}
                                        </span>
                                    </div>
                                    {project.totalArea && (
                                        <div className="overview-info-row">
                                            <span className="overview-info-label">Total Area</span>
                                            <span className="overview-info-value">{project.totalArea.toLocaleString()} m²</span>
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
                                </div>
                            </div>
                            <div>
                                <div className="overview-info-card">
                                    <h3>Quick Actions</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                                        <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => setActiveTab('documents')}>
                                            <Upload size={14} /> Upload Documents
                                        </button>
                                        <Link href="/map" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                                            <Map size={14} /> View on 3D Map
                                        </Link>
                                    </div>
                                </div>
                                <div className="overview-info-card" style={{ marginTop: 'var(--space-4)' }}>
                                    <h3>Timeline</h3>
                                    <div className="overview-info-row">
                                        <span className="overview-info-label">Created</span>
                                        <span className="overview-info-value" style={{ fontSize: 'var(--text-xs)' }}>
                                            {new Date(project.createdAt).toLocaleDateString('pt-PT')}
                                        </span>
                                    </div>
                                    <div className="overview-info-row">
                                        <span className="overview-info-label">Updated</span>
                                        <span className="overview-info-value" style={{ fontSize: 'var(--text-xs)' }}>
                                            {new Date(project.updatedAt).toLocaleDateString('pt-PT')}
                                        </span>
                                    </div>
                                    <div className="overview-info-row">
                                        <span className="overview-info-label">Documents</span>
                                        <span className="overview-info-value">{documents.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Map Tab */}
                    {activeTab === 'map' && (
                        <div className="animate-fade-in" style={{
                            height: 500, borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                            border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-tertiary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexDirection: 'column', gap: 'var(--space-4)',
                        }}>
                            <Map size={48} style={{ opacity: 0.3 }} />
                            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                                3D map view for project location
                            </p>
                            <Link href="/map" className="btn btn-primary btn-sm">
                                <Map size={14} /> Open Full 3D Map
                            </Link>
                        </div>
                    )}

                    {/* Documents Tab */}
                    {activeTab === 'documents' && (
                        <div className="animate-fade-in">
                            {/* Upload Zone */}
                            <div
                                className={`upload-zone ${dragging ? 'dragging' : ''}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload size={40} />
                                <h3>{uploading ? 'Uploading...' : 'Drop files here or click to upload'}</h3>
                                <p>Upload floor plans, technical drawings, and project documents</p>
                                <div className="file-types">
                                    Supported: PDF, DWG, DXF, IFC, JPG, PNG • Max 50MB per file
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept=".pdf,.dwg,.dxf,.ifc,.jpg,.jpeg,.png"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            {/* Document List */}
                            {documents.length > 0 ? (
                                <div className="doc-grid">
                                    {documents.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="doc-card"
                                            onClick={() => {
                                                if (doc.fileType === 'pdf' || doc.fileType === 'jpg' || doc.fileType === 'png') {
                                                    setViewingDoc(doc);
                                                }
                                            }}
                                        >
                                            <div className="doc-card-icon">{getFileTypeIcon(doc.fileType)}</div>
                                            <div className="doc-card-name">{doc.fileName}</div>
                                            <div className="doc-card-meta">
                                                <span>{formatFileSize(doc.fileSize)}</span>
                                                <span>{new Date(doc.uploadedAt).toLocaleDateString('pt-PT')}</span>
                                            </div>
                                            <div style={{ marginTop: 'var(--space-2)', display: 'flex', gap: 'var(--space-2)' }}>
                                                <button
                                                    className="btn btn-sm btn-ghost"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteDoc(doc.id);
                                                    }}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state" style={{ padding: 'var(--space-10) var(--space-6)' }}>
                                    <FileText size={48} />
                                    <h3>No Documents Yet</h3>
                                    <p>Upload floor plans, drawings, and project files to get started.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="animate-fade-in">
                            <div className="overview-info-card" style={{ maxWidth: 600 }}>
                                <h3>Danger Zone</h3>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
                                    Permanently delete this project and all associated documents. This action cannot be undone.
                                </p>
                                <button className="btn btn-danger" onClick={handleDeleteProject}>
                                    <Trash2 size={14} />
                                    Delete Project
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Document Viewer Modal */}
            {viewingDoc && (
                <div className="modal-overlay" onClick={() => setViewingDoc(null)}>
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: 900, maxHeight: '90vh' }}
                    >
                        <div className="modal-header">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                <span>{getFileTypeIcon(viewingDoc.fileType)}</span>
                                {viewingDoc.fileName}
                            </h2>
                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleDeleteDoc(viewingDoc.id)}
                                >
                                    <Trash2 size={12} /> Delete
                                </button>
                                <button className="btn btn-icon btn-ghost" onClick={() => setViewingDoc(null)}>
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="modal-body" style={{ padding: 0 }}>
                            {viewingDoc.dataUrl && (
                                <>
                                    {(viewingDoc.fileType === 'jpg' || viewingDoc.fileType === 'png') && (
                                        <img
                                            src={viewingDoc.dataUrl}
                                            alt={viewingDoc.fileName}
                                            style={{ width: '100%', height: 'auto' }}
                                        />
                                    )}
                                    {viewingDoc.fileType === 'pdf' && (
                                        <iframe
                                            src={viewingDoc.dataUrl}
                                            style={{ width: '100%', height: '70vh', border: 'none' }}
                                            title={viewingDoc.fileName}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
