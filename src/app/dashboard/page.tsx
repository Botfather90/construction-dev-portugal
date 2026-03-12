'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Building2,
    Map,
    BarChart3,
    Layers,
    Plus,
    Search,
    MapPin,
    Ruler,
    X,
    LogOut,
    ChevronRight,
    User,
    Globe,
} from 'lucide-react';
import { listProjects, createProject, seedDemoProjects } from '@/lib/projects';
import { isAuthenticated, getUser, logout } from '@/lib/auth';
import { Project } from '@/types';
import '@/styles/dashboard.css';

const PROJECT_TYPE_ICONS: Record<string, React.ReactNode> = {
    residential: <Building2 size={14} />,
    commercial: <BarChart3 size={14} />,
    mixed: <Layers size={14} />,
    industrial: <Globe size={14} />,
    tourism: <Map size={14} />,
};

const STATUS_LABELS: Record<string, string> = {
    planning: 'Planning',
    design: 'Design',
    permitting: 'Permitting',
    construction: 'Construction',
    completed: 'Completed',
};

export default function DashboardPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [searchFilter, setSearchFilter] = useState('');

    // New project form
    const [newProject, setNewProject] = useState({
        name: '', address: '', description: '', projectType: 'residential' as Project['projectType'],
        totalArea: '', floors: '', units: '',
    });

    useEffect(() => {
        setMounted(true);
        if (!isAuthenticated()) {
            router.push('/auth');
            return;
        }
        let p = listProjects();
        if (p.length === 0) { seedDemoProjects(); p = listProjects(); }
        setProjects(p);
    }, [router]);

    const handleCreate = useCallback(() => {
        if (!newProject.name || !newProject.address) return;
        const p = createProject({
            name: newProject.name,
            address: newProject.address,
            description: newProject.description,
            projectType: newProject.projectType,
            status: 'planning',
            latitude: 38.7169,
            longitude: -9.1399,
            totalArea: newProject.totalArea ? parseInt(newProject.totalArea) : undefined,
            floors: newProject.floors ? parseInt(newProject.floors) : undefined,
            units: newProject.units ? parseInt(newProject.units) : undefined,
        });
        setProjects((prev) => [p, ...prev]);
        setShowCreate(false);
        setNewProject({ name: '', address: '', description: '', projectType: 'residential', totalArea: '', floors: '', units: '' });
    }, [newProject]);

    const handleLogout = () => { logout(); router.push('/auth'); };

    if (!mounted) return null;

    const user = getUser();
    const filtered = searchFilter
        ? projects.filter((p) => p.name.toLowerCase().includes(searchFilter.toLowerCase()) || p.address.toLowerCase().includes(searchFilter.toLowerCase()))
        : projects;

    const totalArea = projects.reduce((sum, p) => sum + (p.totalArea || 0), 0);
    const totalUnits = projects.reduce((sum, p) => sum + (p.units || 0), 0);
    const activeProjects = projects.filter((p) => p.status !== 'completed').length;

    return (
        <div className="dashboard-layout">
            {/* Top Bar */}
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
                        <button
                            onClick={handleLogout}
                            className="dashboard-topbar-link"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <User size={14} />
                            {user?.name || 'User'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="dashboard-content">
                {/* Header */}
                <div className="dashboard-header">
                    <div>
                        <h1>Projects</h1>
                        <p>Manage your construction development portfolio</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                        <Plus size={16} />
                        New Project
                    </button>
                </div>

                {/* Stats */}
                <div className="stats-row">
                    <div className="stat-card glass">
                        <div className="stat-card-label">Total Projects</div>
                        <div className="stat-card-value gradient-text">{projects.length}</div>
                    </div>
                    <div className="stat-card glass">
                        <div className="stat-card-label">Active</div>
                        <div className="stat-card-value gradient-text">{activeProjects}</div>
                    </div>
                    <div className="stat-card glass">
                        <div className="stat-card-label">Total Area</div>
                        <div className="stat-card-value">{totalArea.toLocaleString()} m{'\u00B2'}</div>
                    </div>
                    <div className="stat-card glass">
                        <div className="stat-card-label">Total Units</div>
                        <div className="stat-card-value">{totalUnits}</div>
                    </div>
                </div>

                {/* Search + Project Grid */}
                <div className="projects-section-header">
                    <h2>All Projects</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--color-text-muted)' }} />
                            <input
                                className="input"
                                placeholder="Search projects..."
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                                style={{ paddingLeft: 36, width: 240, height: 36 }}
                            />
                        </div>
                    </div>
                </div>

                {filtered.length > 0 ? (
                    <div className="projects-grid">
                        {filtered.map((project) => (
                            <Link href={`/dashboard/${project.id}`} key={project.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div className="project-card">
                                    <div className="project-card-map">
                                        <div className="project-card-map-placeholder">
                                            <Building2 size={48} />
                                        </div>
                                    </div>
                                    <div className="project-card-body">
                                        <div className="project-card-type">
                                            <span className="badge badge-cyan">
                                                {PROJECT_TYPE_ICONS[project.projectType]}
                                                {project.projectType.charAt(0).toUpperCase() + project.projectType.slice(1)}
                                            </span>
                                        </div>
                                        <div className="project-card-title">{project.name}</div>
                                        <div className="project-card-address">
                                            <MapPin size={13} />
                                            {project.address}
                                        </div>
                                        <div className="project-card-stats">
                                            {project.totalArea && (
                                                <div className="project-card-stat">
                                                    <div className="project-card-stat-value">{project.totalArea.toLocaleString()} m{'\u00B2'}</div>
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
                                                <div className="project-card-stat-value" style={{ color: 'var(--color-accent-cyan)' }}>
                                                    {STATUS_LABELS[project.status]}
                                                </div>
                                                <div className="project-card-stat-label">Status</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <Building2 size={48} />
                        <h3>No projects yet</h3>
                        <p>Create your first construction project to get started.</p>
                        <button className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }} onClick={() => setShowCreate(true)}>
                            <Plus size={16} /> New Project
                        </button>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>New Project</h2>
                            <button className="btn btn-icon btn-ghost" onClick={() => setShowCreate(false)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="create-project-form">
                                <div className="input-group">
                                    <label className="input-label">Project Name <span className="required">*</span></label>
                                    <input className="input" placeholder="e.g. Riverside Towers" value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Address <span className="required">*</span></label>
                                    <input className="input" placeholder="e.g. Rua Augusta, Lisboa" value={newProject.address} onChange={(e) => setNewProject({ ...newProject, address: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Project Type</label>
                                    <select className="input select" value={newProject.projectType} onChange={(e) => setNewProject({ ...newProject, projectType: e.target.value as Project['projectType'] })}>
                                        <option value="residential">Residential</option>
                                        <option value="commercial">Commercial</option>
                                        <option value="mixed">Mixed Use</option>
                                        <option value="industrial">Industrial</option>
                                        <option value="tourism">Tourism</option>
                                    </select>
                                </div>
                                <div className="form-row">
                                    <div className="input-group">
                                        <label className="input-label">Area (m{'\u00B2'})</label>
                                        <input className="input" type="number" placeholder="e.g. 5000" value={newProject.totalArea} onChange={(e) => setNewProject({ ...newProject, totalArea: e.target.value })} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Floors</label>
                                        <input className="input" type="number" placeholder="e.g. 8" value={newProject.floors} onChange={(e) => setNewProject({ ...newProject, floors: e.target.value })} />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Units</label>
                                    <input className="input" type="number" placeholder="e.g. 24" value={newProject.units} onChange={(e) => setNewProject({ ...newProject, units: e.target.value })} />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreate} disabled={!newProject.name || !newProject.address}>
                                <Plus size={14} /> Create Project
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
