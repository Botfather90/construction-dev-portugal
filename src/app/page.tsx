'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Building2,
    Globe,
    Layers,
    Brain,
    FileUp,
    ArrowRight,
    Map,
    BarChart3,
    Shield,
    X,
    Menu,
    ChevronRight,
    Zap,
    Check,
    Eye,
    Target,
    Workflow,
    Users,
    TrendingUp,
    Clock,
    FileCheck,
    DollarSign,
} from 'lucide-react';
import Link from 'next/link';
import '@/styles/landing.css';

/* ---- Particle Canvas ---- */
function ParticleHero() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let particles: Array<{
            x: number; y: number;
            vx: number; vy: number;
            size: number; opacity: number;
        }> = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Create particles
        for (let i = 0; i < 80; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.5 + 0.1,
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(6, 182, 212, ${p.opacity})`;
                ctx.fill();

                // Draw lines between nearby particles
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[j].x - p.x;
                    const dy = particles[j].y - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(6, 182, 212, ${0.06 * (1 - dist / 150)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            });

            animationId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return <canvas ref={canvasRef} className="particle-canvas" />;
}

/* ---- Animated Counter ---- */
function AnimatedCounter({ end, suffix = '' }: { end: number; suffix?: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const counted = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !counted.current) {
                    counted.current = true;
                    const duration = 2000;
                    const start = performance.now();
                    const step = (now: number) => {
                        const progress = Math.min((now - start) / duration, 1);
                        const eased = 1 - Math.pow(1 - progress, 3);
                        setCount(Math.floor(eased * end));
                        if (progress < 1) requestAnimationFrame(step);
                    };
                    requestAnimationFrame(step);
                }
            },
            { threshold: 0.5 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [end]);

    return <div ref={ref}>{count.toLocaleString()}{suffix}</div>;
}

/* ---- Data ---- */
const PROCESS_STEPS = [
    {
        num: '01',
        icon: <Target size={22} />,
        title: 'Select Location',
        description: 'Click anywhere on the 3D map or search an address in Portugal to begin your feasibility analysis.',
    },
    {
        num: '02',
        icon: <Brain size={22} />,
        title: 'AI Analysis',
        description: 'Our engine cross-references PDM zoning, building codes, and lot data to calculate maximum legal yield.',
    },
    {
        num: '03',
        icon: <FileUp size={22} />,
        title: 'Upload & Visualize',
        description: 'Drop floor plans or design your building directly on the map. See it rendered in real 3D city context.',
    },
    {
        num: '04',
        icon: <FileCheck size={22} />,
        title: 'Permit & Feasibility',
        description: 'Get permit cost estimates, required documents checklist, and timeline predictions for municipal approval.',
    },
];

const CAPABILITIES = [
    {
        icon: <Globe size={24} />,
        title: 'Real 3D City Context',
        description: 'Every project placed in its real-world location with surrounding buildings, terrain, and infrastructure.',
        accent: 'cyan',
    },
    {
        icon: <Brain size={24} />,
        title: 'AI-Powered Feasibility',
        description: 'Automatic extraction of measurements, shadow analysis, and regulatory compliance against Portuguese building codes.',
        accent: 'violet',
    },
    {
        icon: <Layers size={24} />,
        title: 'Architectural Layers',
        description: 'View building floor-by-floor — foundation, ground, upper levels, roof. Toggle layers for detailed architectural review.',
        accent: 'emerald',
    },
    {
        icon: <Shield size={24} />,
        title: 'Permit Intelligence',
        description: 'Instant permit type detection (Licenciamento vs. Comunicacao Previa), cost estimates, and required document checklists.',
        accent: 'amber',
    },
    {
        icon: <Building2 size={24} />,
        title: 'Building Simulation',
        description: 'Place mockup buildings on empty lots. Configure height, floors, and style. Visualize remodels before breaking ground.',
        accent: 'blue',
    },
    {
        icon: <TrendingUp size={24} />,
        title: 'ROI Calculator',
        description: 'Maximize legal yield with construction index calculations, unbuilt footprint analysis, and investment feasibility math.',
        accent: 'rose',
    },
];

const STATS = [
    { value: 350, suffix: 'M+', label: '3D Buildings Rendered' },
    { value: 25, suffix: 'cm', label: 'Satellite Resolution' },
    { value: 10, suffix: 'x', label: 'Lower Cost' },
    { value: 48, suffix: 'h', label: 'Permit Analysis Saved' },
];

const PRICING = [
    {
        tier: 'Starter',
        price: '\u20ac99',
        period: '/mo',
        description: 'Freelance architects and small agencies',
        features: ['3 active projects', '3D map with real buildings', 'Plan upload (10/mo)', 'Basic 3D views', '1 user seat'],
        cta: 'Start Free Trial',
        featured: false,
    },
    {
        tier: 'Professional',
        price: '\u20ac199',
        period: '/mo',
        description: 'SME developers and engineering firms',
        features: ['10 active projects', 'AI-powered analysis', 'Shadow & feasibility studies', '5 user seats', 'Permit intelligence', 'Priority support'],
        cta: 'Start Free Trial',
        featured: true,
    },
    {
        tier: 'Enterprise',
        price: 'Custom',
        period: '',
        description: 'Large firms and municipalities',
        features: ['Unlimited projects', 'Full API access', 'SSO & custom integrations', 'Municipality dashboard', 'White-label reports', 'Dedicated CSM'],
        cta: 'Contact Sales',
        featured: false,
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
                <div className="nav-inner container">
                    <Link href="/" className="nav-logo">
                        <div className="nav-logo-icon">
                            <Building2 size={18} />
                        </div>
                        ConstruViz
                    </Link>

                    <div className="nav-center hide-mobile">
                        <a href="#process">How It Works</a>
                        <a href="#capabilities">Capabilities</a>
                        <a href="#pricing">Pricing</a>
                    </div>

                    <div className="nav-actions">
                        <Link href="/auth" className="btn btn-ghost btn-sm hide-mobile">
                            Sign In
                        </Link>
                        <Link href="/map" className="btn btn-primary btn-sm">
                            <Map size={14} />
                            Launch Map
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

                {mobileMenuOpen && (
                    <div className="mobile-menu glass-strong">
                        <a href="#process" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
                        <a href="#capabilities" onClick={() => setMobileMenuOpen(false)}>Capabilities</a>
                        <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
                        <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                        <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                    </div>
                )}
            </nav>

            {/* ---- Hero ---- */}
            <section className="hero" id="hero">
                <ParticleHero />
                <div className="hero-beams">
                    <div className="beam beam-1" />
                    <div className="beam beam-2" />
                    <div className="beam beam-3" />
                </div>
                <div className="hero-gradient-orb" />

                <div className="container hero-content">
                    <div className="hero-badge">
                        <span className="hero-badge-dot" />
                        Built for Portugal
                    </div>

                    <h1>
                        Visualize Construction<br />
                        <span className="gradient-text">Before Breaking Ground</span>
                    </h1>

                    <p className="hero-subtitle">
                        The AI-native platform for architects, engineers, and real estate developers.
                        Upload plans, simulate buildings in real 3D city context, and get instant
                        permit feasibility analysis.
                    </p>

                    <div className="hero-cta">
                        <Link href="/map" className="btn btn-primary btn-lg hero-btn-glow">
                            <Map size={18} />
                            Explore 3D Map
                            <ArrowRight size={16} />
                        </Link>
                        <Link href="/auth" className="btn btn-glass btn-lg">
                            Try Demo
                        </Link>
                    </div>
                </div>
            </section>

            {/* ---- Stats Bar ---- */}
            <section className="stats-bar">
                <div className="container">
                    <div className="stats-bar-inner">
                        {STATS.map((stat, i) => (
                            <div key={i} className="stats-bar-item">
                                <div className="stats-bar-value gradient-text">
                                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                                </div>
                                <div className="stats-bar-label">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---- Process / How It Works ---- */}
            <section className="section" id="process">
                <div className="container">
                    <div className="section-header">
                        <div className="section-eyebrow">How It Works</div>
                        <h2 className="section-title">
                            From Location to <span className="gradient-text">Feasibility</span> in Minutes
                        </h2>
                    </div>

                    <div className="process-grid">
                        {PROCESS_STEPS.map((step, i) => (
                            <div key={i} className="process-step">
                                <div className="process-num">{step.num}</div>
                                <div className="process-icon">{step.icon}</div>
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                                {i < PROCESS_STEPS.length - 1 && (
                                    <div className="process-connector hide-mobile">
                                        <ChevronRight size={16} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---- Capabilities ---- */}
            <section className="section section-alt" id="capabilities">
                <div className="container">
                    <div className="section-header">
                        <div className="section-eyebrow">Capabilities</div>
                        <h2 className="section-title">
                            Enterprise Power,{' '}
                            <span className="gradient-text">Accessible Price</span>
                        </h2>
                        <p className="section-description">
                            Everything architects, engineers, and developers need — 3D visualization,
                            AI analysis, and permit intelligence in one platform.
                        </p>
                    </div>

                    <div className="capabilities-grid">
                        {CAPABILITIES.map((cap, i) => (
                            <div key={i} className={`capability-item accent-${cap.accent}`}>
                                <div className="capability-icon">{cap.icon}</div>
                                <div className="capability-content">
                                    <h3>{cap.title}</h3>
                                    <p>{cap.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---- Showcase / Visual ---- */}
            <section className="section" id="showcase">
                <div className="container">
                    <div className="showcase-split">
                        <div className="showcase-text">
                            <div className="section-eyebrow">Live 3D Simulation</div>
                            <h2 className="section-title" style={{ textAlign: 'left' }}>
                                Place Buildings on<br />
                                <span className="gradient-text">Real City Maps</span>
                            </h2>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-8)', lineHeight: 'var(--leading-relaxed)' }}>
                                Select any empty lot, configure your building parameters, and see it rendered
                                alongside real surrounding structures. Test remodels, expansions, and new construction
                                with instant regulatory feedback.
                            </p>
                            <div className="showcase-features">
                                <div className="showcase-feature">
                                    <Eye size={16} />
                                    <span>Multi-angle 3D views</span>
                                </div>
                                <div className="showcase-feature">
                                    <Layers size={16} />
                                    <span>Floor-by-floor layering</span>
                                </div>
                                <div className="showcase-feature">
                                    <Workflow size={16} />
                                    <span>Bridge & infrastructure</span>
                                </div>
                                <div className="showcase-feature">
                                    <Users size={16} />
                                    <span>Team collaboration</span>
                                </div>
                            </div>
                            <Link href="/map" className="btn btn-primary" style={{ marginTop: 'var(--space-6)' }}>
                                Open 3D Map
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                        <div className="showcase-visual">
                            <div className="showcase-mock">
                                <div className="showcase-mock-header">
                                    <span /><span /><span />
                                </div>
                                <div className="showcase-mock-body">
                                    <div className="showcase-building">
                                        <div className="building-floor building-roof" />
                                        <div className="building-floor building-f3" />
                                        <div className="building-floor building-f2" />
                                        <div className="building-floor building-f1" />
                                        <div className="building-floor building-ground" />
                                        <div className="building-floor building-foundation" />
                                    </div>
                                    <div className="showcase-labels">
                                        <span>Roof</span>
                                        <span>Floor 3</span>
                                        <span>Floor 2</span>
                                        <span>Floor 1</span>
                                        <span>Ground</span>
                                        <span>Foundation</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ---- Pricing ---- */}
            <section className="section section-alt" id="pricing">
                <div className="container">
                    <div className="section-header">
                        <div className="section-eyebrow">Pricing</div>
                        <h2 className="section-title">
                            Start Free, <span className="gradient-text">Scale When Ready</span>
                        </h2>
                        <p className="section-description">
                            3 free projects included. Upgrade when you need more power,
                            more seats, or AI-driven analysis.
                        </p>
                    </div>

                    <div className="pricing-grid">
                        {PRICING.map((plan, i) => (
                            <div key={i} className={`pricing-card ${plan.featured ? 'pricing-featured' : ''}`}>
                                {plan.featured && <span className="pricing-popular">Recommended</span>}
                                <div className="pricing-tier">{plan.tier}</div>
                                <div className="pricing-price">
                                    <span className="pricing-amount">{plan.price}</span>
                                    {plan.period && <span className="pricing-period">{plan.period}</span>}
                                </div>
                                <div className="pricing-desc">{plan.description}</div>
                                <ul className="pricing-features">
                                    {plan.features.map((f, j) => (
                                        <li key={j}>
                                            <Check size={14} />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <div className="pricing-cta">
                                    <Link
                                        href={plan.featured ? '/auth' : '#'}
                                        className={`btn ${plan.featured ? 'btn-primary' : 'btn-glass'}`}
                                        style={{ width: '100%' }}
                                    >
                                        {plan.cta}
                                        <ChevronRight size={14} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---- Final CTA ---- */}
            <section className="cta-section">
                <div className="cta-beams">
                    <div className="beam beam-cta-1" />
                    <div className="beam beam-cta-2" />
                </div>
                <div className="cta-content container">
                    <h2>
                        Ready to <span className="gradient-text">Build Smarter</span>?
                    </h2>
                    <p>
                        Join architects, engineers, and developers who visualize construction
                        before breaking ground.
                    </p>
                    <div className="cta-buttons">
                        <Link href="/map" className="btn btn-primary btn-lg hero-btn-glow">
                            <Map size={18} />
                            Explore 3D Map
                            <ArrowRight size={16} />
                        </Link>
                        <Link href="/auth" className="btn btn-glass btn-lg">
                            Create Free Account
                        </Link>
                    </div>
                </div>
            </section>

            {/* ---- Footer ---- */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-inner">
                        <div className="footer-brand">
                            <div className="nav-logo" style={{ marginBottom: 'var(--space-3)' }}>
                                <div className="nav-logo-icon">
                                    <Building2 size={16} />
                                </div>
                                ConstruViz
                            </div>
                            <p>
                                AI-native construction visualization for Portugal.
                                Powered by Digiton Dynamics.
                            </p>
                        </div>
                        <div className="footer-links">
                            <div className="footer-col">
                                <h4>Product</h4>
                                <a href="#capabilities">Capabilities</a>
                                <a href="#pricing">Pricing</a>
                                <Link href="/map">3D Map</Link>
                                <Link href="/dashboard">Dashboard</Link>
                            </div>
                            <div className="footer-col">
                                <h4>Company</h4>
                                <a href="mailto:brandon@digiton.ai">Contact</a>
                                <a href="#">Privacy</a>
                                <a href="#">Terms</a>
                            </div>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <span>&copy; {new Date().getFullYear()} Digiton Dynamics. All rights reserved.</span>
                        <span>Built in Lisbon & Tallinn</span>
                    </div>
                </div>
            </footer>
        </>
    );
}
