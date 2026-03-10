'use client';

import { useState, useEffect } from 'react';
import {
    Building2,
    Cpu,
    Upload,
    DollarSign,
    Globe,
    Layers,
    Brain,
    FileUp,
    Check,
    ArrowRight,
    Map,
    BarChart3,
    Shield,
    X,
    Menu,
    ChevronRight,
    Sparkles,
    Zap,
} from 'lucide-react';
import Link from 'next/link';
import '@/styles/landing.css';

const FEATURES = [
    {
        icon: <Globe size={24} />,
        colorClass: 'feature-icon-cyan',
        title: 'Real 3D City Context',
        description:
            'Every project is automatically placed in its real-world location with surrounding buildings, terrain, and infrastructure. No more guessing — see exactly how your development fits.',
    },
    {
        icon: <Brain size={24} />,
        colorClass: 'feature-icon-violet',
        title: 'AI-Powered Analysis',
        description:
            'Automatic extraction of measurements, shadow analysis, view corridor assessment, and regulatory compliance checking against Portuguese building codes.',
    },
    {
        icon: <FileUp size={24} />,
        colorClass: 'feature-icon-emerald',
        title: 'Upload & Visualize',
        description:
            'Drag-and-drop floor plans (PDF, DWG, IFC) and instantly see them rendered in 3D. Multi-floor support, version comparison, and automatic room detection.',
    },
    {
        icon: <DollarSign size={24} />,
        colorClass: 'feature-icon-amber',
        title: '10x Cost Advantage',
        description:
            'Enterprise-grade capabilities starting at €99/month. Get 80% of the value of tools costing €3,000+/year, designed specifically for Portuguese developers.',
    },
];

const PRICING = [
    {
        tier: 'Starter',
        price: '€99',
        period: '/mo',
        description: 'For freelance architects and small agencies',
        features: [
            '3 active projects',
            '3D map with real buildings',
            'Plan upload (10/month)',
            'Basic 3D views',
            '1 user seat',
        ],
        cta: 'Start Free Trial',
        featured: false,
    },
    {
        tier: 'Professional',
        price: '€199',
        period: '/mo',
        description: 'For SME developers and engineering firms',
        features: [
            '10 active projects',
            'AI-powered analysis',
            'Shadow studies',
            '5 user seats',
            'Presentations & IFC support',
            'Priority email support',
        ],
        cta: 'Start Free Trial',
        featured: true,
    },
    {
        tier: 'Business',
        price: '€399',
        period: '/mo',
        description: 'For mid-market developers and construction companies',
        features: [
            'Unlimited projects',
            'Compliance checker',
            'API access',
            '20 user seats',
            'White-label reports',
            'Priority support',
        ],
        cta: 'Contact Sales',
        featured: false,
    },
    {
        tier: 'Enterprise',
        price: 'Custom',
        period: '',
        description: 'For large firms and municipalities',
        features: [
            'Everything in Business',
            'SSO & custom integrations',
            'Municipality dashboard',
            'Dedicated CSM',
            'Custom SLA',
            'On-premise option',
        ],
        cta: 'Contact Sales',
        featured: false,
    },
];

const COMPARISON = [
    {
        solution: 'Autodesk Revit',
        cost: '€2,675-3,675/yr',
        city3d: false,
        ai: false,
        planUpload: 'BIM only',
        ptFocus: false,
    },
    {
        solution: 'Autodesk Forma',
        cost: '€3,675+/yr',
        city3d: true,
        ai: 'Partial',
        planUpload: false,
        ptFocus: false,
    },
    {
        solution: 'Procore',
        cost: '€4,500+/yr',
        city3d: false,
        ai: false,
        planUpload: 'Markup',
        ptFocus: false,
    },
    {
        solution: 'ArcGIS GeoBIM',
        cost: '€10,000+/yr',
        city3d: true,
        ai: false,
        planUpload: 'BIM only',
        ptFocus: false,
    },
    {
        solution: 'Giraffe',
        cost: '€540-1,500/yr',
        city3d: true,
        ai: 'Partial',
        planUpload: 'Limited',
        ptFocus: false,
    },
    {
        solution: 'ConstruViz',
        cost: '€1,188-2,388/yr',
        city3d: true,
        ai: true,
        planUpload: true,
        ptFocus: true,
        highlight: true,
    },
];

export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            {/* ---- Navigation ---- */}
            <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`} id="main-nav">
                <div className="container nav-inner">
                    <Link href="/" className="nav-logo">
                        <div className="nav-logo-icon">
                            <Building2 size={20} />
                        </div>
                        ConstruViz
                    </Link>

                    <ul className="nav-links hide-mobile">
                        <li><a href="#features">Features</a></li>
                        <li><a href="#pricing">Pricing</a></li>
                        <li><a href="#comparison">Compare</a></li>
                    </ul>

                    <div className="nav-actions">
                        <Link href="/dashboard" className="btn btn-ghost hide-mobile">
                            Dashboard
                        </Link>
                        <Link href="/map" className="btn btn-primary">
                            <Map size={16} />
                            Open Map
                        </Link>
                        <button
                            className="btn btn-icon btn-ghost hide-desktop"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div
                        className="glass-strong"
                        style={{
                            padding: 'var(--space-4) var(--space-6)',
                            borderTop: '1px solid var(--color-border-subtle)',
                        }}
                    >
                        <a href="#features" style={{ display: 'block', padding: '8px 0', color: 'var(--color-text-secondary)' }}>Features</a>
                        <a href="#pricing" style={{ display: 'block', padding: '8px 0', color: 'var(--color-text-secondary)' }}>Pricing</a>
                        <a href="#comparison" style={{ display: 'block', padding: '8px 0', color: 'var(--color-text-secondary)' }}>Compare</a>
                        <Link href="/dashboard" style={{ display: 'block', padding: '8px 0', color: 'var(--color-text-secondary)' }}>Dashboard</Link>
                    </div>
                )}
            </nav>

            {/* ---- Hero ---- */}
            <section className="hero" id="hero">
                <div className="hero-bg">
                    <div className="hero-grid" />
                </div>
                <div className="container hero-content">
                    <div className="hero-badge">
                        <span className="hero-badge-dot" />
                        AI-Native • Built for Portugal
                    </div>

                    <h1>
                        See Your{' '}
                        <span className="gradient-text">Development</span>
                        <br />
                        In Real 3D Context
                    </h1>

                    <p className="hero-subtitle">
                        Upload floor plans, visualize new construction alongside real surrounding
                        buildings, and leverage AI for automated analysis — at 10x lower cost
                        than enterprise tools.
                    </p>

                    <div className="hero-cta">
                        <Link href="/map" className="btn btn-primary btn-lg">
                            <Map size={18} />
                            Explore the 3D Map
                            <ArrowRight size={16} />
                        </Link>
                        <Link href="/dashboard" className="btn btn-secondary btn-lg">
                            <Layers size={18} />
                            View Dashboard
                        </Link>
                    </div>

                    <div className="hero-stats">
                        <div className="hero-stat">
                            <div className="hero-stat-value gradient-text">350M+</div>
                            <div className="hero-stat-label">3D Buildings Worldwide</div>
                        </div>
                        <div className="hero-stat">
                            <div className="hero-stat-value gradient-text">25cm</div>
                            <div className="hero-stat-label">Satellite Resolution (DGT)</div>
                        </div>
                        <div className="hero-stat">
                            <div className="hero-stat-value gradient-text-warm">10x</div>
                            <div className="hero-stat-label">Lower Cost Than Enterprise</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ---- Features ---- */}
            <section className="section" id="features">
                <div className="container">
                    <div className="section-header">
                        <div className="section-label">
                            <Sparkles size={16} />
                            Core Capabilities
                        </div>
                        <h2 className="section-title">
                            Everything You Need to{' '}
                            <span className="gradient-text">Visualize Construction</span>
                        </h2>
                        <p className="section-description">
                            From floor plan upload to 3D city context, ConstruViz gives you enterprise-grade
                            visualization at a fraction of the cost.
                        </p>
                    </div>

                    <div className="features-grid">
                        {FEATURES.map((feature, i) => (
                            <div
                                key={i}
                                className="feature-card"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            >
                                <div className={`feature-icon ${feature.colorClass}`}>
                                    {feature.icon}
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---- Comparison ---- */}
            <section className="section" id="comparison" style={{ background: 'var(--color-bg-secondary)' }}>
                <div className="container">
                    <div className="section-header">
                        <div className="section-label">
                            <BarChart3 size={16} />
                            Competitive Advantage
                        </div>
                        <h2 className="section-title">
                            How We <span className="gradient-text-warm">Compare</span>
                        </h2>
                        <p className="section-description">
                            ConstruViz is the only platform combining 3D city context, AI capabilities,
                            floor plan upload, AND Portugal-specific focus at an accessible price.
                        </p>
                    </div>

                    <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border-subtle)' }}>
                        <table className="comparison-table">
                            <thead>
                                <tr>
                                    <th>Solution</th>
                                    <th>Annual Cost/Seat</th>
                                    <th>3D City Context</th>
                                    <th>AI Native</th>
                                    <th>Floor Plan Upload</th>
                                    <th>PT Focus</th>
                                </tr>
                            </thead>
                            <tbody>
                                {COMPARISON.map((row, i) => (
                                    <tr key={i} className={row.highlight ? 'comparison-highlight' : ''}>
                                        <td style={row.highlight ? { fontWeight: 700, color: 'var(--color-accent-cyan)' } : {}}>
                                            {row.solution}
                                        </td>
                                        <td className={row.highlight ? 'comparison-highlight' : ''}>
                                            {row.cost}
                                        </td>
                                        <td>
                                            {row.city3d === true ? (
                                                <Check size={16} className="check" />
                                            ) : (
                                                <X size={16} className="cross" />
                                            )}
                                        </td>
                                        <td>
                                            {row.ai === true ? (
                                                <Check size={16} className="check" />
                                            ) : row.ai === 'Partial' ? (
                                                <span style={{ color: 'var(--color-accent-amber)', fontSize: 'var(--text-xs)' }}>Partial</span>
                                            ) : (
                                                <X size={16} className="cross" />
                                            )}
                                        </td>
                                        <td>
                                            {row.planUpload === true ? (
                                                <Check size={16} className="check" />
                                            ) : typeof row.planUpload === 'string' ? (
                                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{row.planUpload}</span>
                                            ) : (
                                                <X size={16} className="cross" />
                                            )}
                                        </td>
                                        <td>
                                            {row.ptFocus ? (
                                                <Check size={16} className="check" />
                                            ) : (
                                                <X size={16} className="cross" />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* ---- Pricing ---- */}
            <section className="section" id="pricing">
                <div className="container">
                    <div className="section-header">
                        <div className="section-label">
                            <Zap size={16} />
                            Simple Pricing
                        </div>
                        <h2 className="section-title">
                            Enterprise Power,{' '}
                            <span className="gradient-text">Startup Price</span>
                        </h2>
                        <p className="section-description">
                            Start with 3 free projects. Upgrade when you need more power, more seats,
                            or AI-driven analysis.
                        </p>
                    </div>

                    <div className="pricing-grid">
                        {PRICING.map((plan, i) => (
                            <div
                                key={i}
                                className={`pricing-card ${plan.featured ? 'pricing-card-featured' : ''}`}
                            >
                                {plan.featured && <span className="pricing-popular">Most Popular</span>}
                                <div className="pricing-tier">{plan.tier}</div>
                                <div className="pricing-price">
                                    <span className="pricing-amount">{plan.price}</span>
                                    {plan.period && <span className="pricing-period">{plan.period}</span>}
                                </div>
                                <div className="pricing-description">{plan.description}</div>
                                <ul className="pricing-features">
                                    {plan.features.map((f, j) => (
                                        <li key={j}>
                                            <Check size={16} />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <div className="pricing-cta">
                                    <button
                                        className={`btn ${plan.featured ? 'btn-primary' : 'btn-secondary'}`}
                                        style={{ width: '100%' }}
                                    >
                                        {plan.cta}
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---- CTA ---- */}
            <section className="cta-section">
                <div className="cta-content container">
                    <h2>
                        Ready to <span className="gradient-text">Visualize</span>?
                    </h2>
                    <p>
                        Join the future of Portuguese construction development. Start for free,
                        upgrade when you grow.
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/map" className="btn btn-primary btn-lg">
                            <Map size={18} />
                            Explore the 3D Map
                            <ArrowRight size={16} />
                        </Link>
                        <Link href="/dashboard" className="btn btn-secondary btn-lg">
                            Open Dashboard
                        </Link>
                    </div>
                </div>
            </section>

            {/* ---- Footer ---- */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <div className="nav-logo" style={{ marginBottom: 'var(--space-2)' }}>
                                <div className="nav-logo-icon">
                                    <Building2 size={20} />
                                </div>
                                ConstruViz
                            </div>
                            <p>
                                AI-native construction development visualization platform.
                                Built for Portugal. Powered by Digiton Dynamics.
                            </p>
                        </div>
                        <div className="footer-col">
                            <h4>Product</h4>
                            <a href="#features">Features</a>
                            <a href="#pricing">Pricing</a>
                            <a href="#comparison">Compare</a>
                            <Link href="/map">3D Map</Link>
                            <Link href="/dashboard">Dashboard</Link>
                        </div>
                        <div className="footer-col">
                            <h4>Resources</h4>
                            <a href="#">Documentation</a>
                            <a href="#">API Reference</a>
                            <a href="#">Tutorials</a>
                            <a href="#">Blog</a>
                        </div>
                        <div className="footer-col">
                            <h4>Company</h4>
                            <a href="#">About Digiton</a>
                            <a href="#">Careers</a>
                            <a href="mailto:brandon@digiton.ai">Contact</a>
                            <a href="#">Privacy Policy</a>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <span>© {new Date().getFullYear()} Digiton Dynamics OÜ. All rights reserved.</span>
                        <span>Built with ☕ in Lisbon & Tallinn</span>
                    </div>
                </div>
            </footer>
        </>
    );
}
