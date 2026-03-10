'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Building2,
    Plus,
    Map,
    Layers,
    FolderOpen,
    MapPin,
    BarChart3,
    TrendingUp,
    Clock,
    LayoutDashboard,
    X,
    Building,
    Hotel,
    Factory,
    Home as HomeIcon,
    Store,
    ArrowRight,
    ChevronRight,
} from 'lucide-react';
import { listProjects, createProject, seedDemoProjects } from '@/lib/projects';
import type { Project } from '@/types';
import '@/styles/dashboard.css';

const PROJECT_TYPE_ICONS: Record<string, any> = {
    residential: <HomeIcon size={14} />,
    commercial: <Store size={14} />,
    mixed: <Building size={14} />,
    industrial: <Factory size={14} />,
    tourism: <Hotel size={14} />,
};

const PROJECT_TYPE_LABELS: Record<string, string> = {
    residential: 'Residential',
    commercial: 'Commercial',
    mixed: 'Mixed Use',
    industrial: 'Industrial',
    tourism: 'Tourism',
};

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
    planning: { label: 'Planning', className: 'badge-violet' },
    design: { label: 'Design', className: 'badge-cyan' },
    permitting: { label: 'Permitting', className: 'badge-amber' },
    construction: { label: 'Construction', className: 'badge-emerald' },
    completed: { label: 'Completed', className: 'badge-emerald' },
};

export default function DashboardPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Form state
    const [formName, setFormName] = useState('');
    const [formAddress, setFormAddress] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formType, setFormType] = useState<Project['projectType']>('residential');
    const [formLat, setFormLat] = useState('38.7223');
    const [formLng, setFormLng] = useState('-9.1393');
    const [formArea, setFormArea] = useState('');
    const [formFloors, setFormFloors] = useState('');
    const [formUnits, setFormUnits] = useState('');

    useEffect(() => {
        setMounted(true);
        seedDemoProjects();
        setProjects(listProjects());
    }, []);

    const handleCreateProject = () => {
        if (!formName.trim()) return;

        createProject({
            name: formName.trim(),
            description: formDescription.trim(),
            address: formAddress.trim(),
            latitude: parseFloat(formLat) || 38.7223,
            longitude: parseFloat(formLng) || -9.1393,
            projectType: formType,
            status: 'planning',
            totalArea: formArea ? parseInt(formArea) : undefined,
            floors: formFloors ? parseInt(formFloors) : undefined,
            units: formUnits ? parseInt(formUnits) : undefined,
        });

        setProjects(listProjects());
        setShowCreateModal(false);
        resetForm();
    };

    const resetForm = () => {
        setFormName('');
        setFormAddress('');
        setFormDescription('');
        setFormType('residential');
        setFormLat('38.7223');
        setFormLng('-9.1393');
        setFormArea('');
        setFormFloors('');
        setFormUnits('');
    };

    const totalArea = projects.reduce((sum, p) => sum + (p.totalArea || 0), 0);
    const totalUnits = projects.reduce((sum, p) => sum + (p.units || 0), 0);

    if (!mounted) return null;

    return (
        <div className="dashboard-layout">
            {/* Top Bar */}
            <div className="dashboard-topbar">
                <div className="dashboard-topbar-inner">
                    <Link href="/" className="dashboard-logo">
                        <span
                            style={{
                                width: 28,
                                height: 28,
                                background: 'var(--gradient-primary)',
                                borderRadius: 'var(--radius-sm)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
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

                    <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                        <Link href="/map" className="btn btn-sm btn-primary">
                            <Map size={14} />
                            Open Map
                        </Link>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="dashboard-content">
                {/* Header */}
                <div className="dashboard-header">
                    <div>
                        <h1>My Projects</h1>
                        <p>Manage your construction development projects across Portugal</p>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <Plus size={16} />
                        New Project
                    </button>
                </div>

                {/* Stats */}
                <div className="stats-row">
                    <div className="stat-card">
                        <div className="stat-card-label">Total Projects</div>
                        <div className="stat-card-value gradient-text">{projects.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-label">Total Area</div>
                        <div className="stat-card-value">{totalArea.toLocaleString()} m²</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-label">Total Units</div>
                        <div className="stat-card-value">{totalUnits}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-label">Active Phase</div>
                        <div className="stat-card-value" style={{ color: 'var(--color-accent-emerald)' }}>
                            {projects.filter((p) => p.status === 'construction').length} In Construction
                        </div>
                    </div>
                </div>

                {/* Projects */}
                <div className="projects-section-header">
                    <h2>All Projects</h2>
                </div>

                {projects.length === 0 ? (
                    <div className="empty-state">
                        <FolderOpen size={64} />
                        <h3>No Projects Yet</h3>
                        <p>Create your first construction development project to get started.</p>
                        <button
                            className="btn btn-primary"
                            style={{ marginTop: 'var(--space-4)' }}
                            onClick={() => setShowCreateModal(true)}
                        >
                            <Plus size={16} />
                            Create Project
                        </button>
                    </div>
                ) : (
                    <div className="projects-grid">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className="project-card"
                                onClick={() => router.push(`/dashboard/${project.id}`)}
                            >
                                <div className="project-card-map">
                                    <div className="project-card-map-placeholder">
                                        <Map size={48} />
                                    </div>
                                </div>
                                <div className="project-card-body">
                                    <div className="project-card-type">
                                        <span className={`badge ${STATUS_BADGES[project.status]?.className || 'badge-cyan'}`}>
                                            {STATUS_BADGES[project.status]?.label || project.status}
                                        </span>
                                    </div>
                                    <div className="project-card-title">{project.name}</div>
                                    <div className="project-card-address">
                                        <MapPin size={14} />
                                        {project.address || 'No address set'}
                                    </div>
                                    <div className="project-card-stats">
                                        {project.totalArea && (
                                            <div className="project-card-stat">
                                                <div className="project-card-stat-value">
                                                    {project.totalArea.toLocaleString()} m²
                                                </div>
                                                <div className="project-card-stat-label">Area</div>
                                            </div>
                                        )}
                                        {project.floors && (
                                            <div className="project-card-stat">
                                                <div className="project-card-stat-value">{project.floors}</div>
                                                <div className="project-card-stat-label">Floors</div>
                                            </div>
                                        )}
                                        {project.units && (
                                            <div className="project-card-stat">
                                                <div className="project-card-stat-value">{project.units}</div>
                                                <div className="project-card-stat-label">Units</div>
                                            </div>
                                        )}
                                        <div className="project-card-stat" style={{ marginLeft: 'auto' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-accent-cyan)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                                                View <ChevronRight size={12} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Project Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
                        <div className="modal-header">
                            <h2>Create New Project</h2>
                            <button className="btn btn-icon btn-ghost" onClick={() => setShowCreateModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="create-project-form">
                                <div className="input-group">
                                    <label className="input-label">
                                        Project Name <span className="required">*</span>
                                    </label>
                                    <input
                                        className="input"
                                        placeholder="e.g. Residências da Estrela"
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Address</label>
                                    <input
                                        className="input"
                                        placeholder="e.g. Rua da Estrela 42, Lisboa"
                                        value={formAddress}
                                        onChange={(e) => setFormAddress(e.target.value)}
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Description</label>
                                    <textarea
                                        className="input textarea"
                                        placeholder="Describe the project..."
                                        value={formDescription}
                                        onChange={(e) => setFormDescription(e.target.value)}
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Project Type</label>
                                    <select
                                        className="input select"
                                        value={formType}
                                        onChange={(e) => setFormType(e.target.value as Project['projectType'])}
                                    >
                                        <option value="residential">🏠 Residential</option>
                                        <option value="commercial">🏢 Commercial</option>
                                        <option value="mixed">🏗️ Mixed Use</option>
                                        <option value="industrial">🏭 Industrial</option>
                                        <option value="tourism">🏨 Tourism</option>
                                    </select>
                                </div>

                                <div className="form-row">
                                    <div className="input-group">
                                        <label className="input-label">Latitude</label>
                                        <input
                                            className="input"
                                            type="number"
                                            step="0.0001"
                                            placeholder="38.7223"
                                            value={formLat}
                                            onChange={(e) => setFormLat(e.target.value)}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Longitude</label>
                                        <input
                                            className="input"
                                            type="number"
                                            step="0.0001"
                                            placeholder="-9.1393"
                                            value={formLng}
                                            onChange={(e) => setFormLng(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="input-group">
                                        <label className="input-label">Total Area (m²)</label>
                                        <input
                                            className="input"
                                            type="number"
                                            placeholder="e.g. 5000"
                                            value={formArea}
                                            onChange={(e) => setFormArea(e.target.value)}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Floors</label>
                                        <input
                                            className="input"
                                            type="number"
                                            placeholder="e.g. 6"
                                            value={formFloors}
                                            onChange={(e) => setFormFloors(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Units</label>
                                    <input
                                        className="input"
                                        type="number"
                                        placeholder="e.g. 24"
                                        value={formUnits}
                                        onChange={(e) => setFormUnits(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                disabled={!formName.trim()}
                                onClick={handleCreateProject}
                            >
                                <Plus size={16} />
                                Create Project
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
