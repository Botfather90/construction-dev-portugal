// ConstruViz — Simple Auth Utilities (Demo-ready)

const AUTH_KEY = 'construviz_auth';
const USER_KEY = 'construviz_user';

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    isDemo: boolean;
}

const DEMO_USER: AuthUser = {
    id: 'demo-user-001',
    name: 'Demo User',
    email: 'demo@construviz.pt',
    avatar: '',
    isDemo: true,
};

export function isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(AUTH_KEY) === 'true';
}

export function getUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(USER_KEY);
    if (!data) return null;
    try {
        return JSON.parse(data) as AuthUser;
    } catch {
        return null;
    }
}

export function loginAsDemo(): AuthUser {
    localStorage.setItem(AUTH_KEY, 'true');
    localStorage.setItem(USER_KEY, JSON.stringify(DEMO_USER));
    return DEMO_USER;
}

export function loginWithGoogle(name: string, email: string): AuthUser {
    const user: AuthUser = {
        id: `google-${Date.now()}`,
        name,
        email,
        isDemo: false,
    };
    localStorage.setItem(AUTH_KEY, 'true');
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
}

export function logout(): void {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
}
