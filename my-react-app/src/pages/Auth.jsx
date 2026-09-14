import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Facebook, Github, Linkedin, Chrome } from 'lucide-react';
import Navbar from '../components/Navbar';
import { authService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import './Auth.css';

export default function Auth() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const { setUser } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user'
    });

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        setIsSignUp(location.pathname === '/signup');
        setError('');
    }, [location.pathname]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
        setSuccessMessage('');
    };

    const validateSignup = () => {
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (isSignUp && !validateSignup()) return;

        setLoading(true);

        try {
            if (isSignUp) {
                await authService.register(
                    formData.name,
                    formData.email,
                    formData.password,
                    formData.role
                );

                setSuccessMessage('Account created successfully! Please sign in.');
                setIsSignUp(false);
                navigate('/login');
            } else {
                const result = await authService.login(
                    formData.email,
                    formData.password
                );

                // Update global auth state
                setUser(result.user);

                // Persist user
                localStorage.setItem('user', JSON.stringify(result.user));
                localStorage.setItem('token', result.token);

                // Redirect to dashboard
                window.location.href = '/dashboard';
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                `${isSignUp ? 'Registration' : 'Login'} failed. Please try again.`
            );
        } finally {
            setLoading(false);
        }
    };

    const switchMode = (signUp) => {
        setIsSignUp(signUp);
        setError('');
        navigate(signUp ? '/signup' : '/login');
    };

    const SocialIcons = () => (
        <div className="social-icons">
            <a href="#" className="icon" aria-label="Sign in with Google"><Chrome size={20} /></a>
            <a href="#" className="icon" aria-label="Sign in with Facebook"><Facebook size={20} /></a>
            <a href="#" className="icon" aria-label="Sign in with GitHub"><Github size={20} /></a>
            <a href="#" className="icon" aria-label="Sign in with LinkedIn"><Linkedin size={20} /></a>
        </div>
    );

    return (
        <>
            <Navbar />
            <div className="auth-wrapper">

                <div className={`container ${isSignUp ? 'active' : ''}`} id="container">

                    {/* Mobile Tabs Switcher (visible on mobile only) */}
                    <div className="mobile-auth-tabs">
                        <button 
                            type="button" 
                            className={`mobile-tab ${!isSignUp ? 'active' : ''}`}
                            onClick={() => switchMode(false)}
                        >
                            Sign In
                        </button>
                        <button 
                            type="button" 
                            className={`mobile-tab ${isSignUp ? 'active' : ''}`}
                            onClick={() => switchMode(true)}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* SIGN UP */}
                    <div className="form-container sign-up">
                        <form onSubmit={handleSubmit}>
                            <h1>Create Account</h1>
                            <SocialIcons />
                            <span>or use your email for registration</span>

                            <input
                                type="text"
                                name="name"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                autoComplete="name"
                            />

                            <input
                                type="email"
                                name="email"
                                placeholder="Email address"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                autoComplete="email"
                            />

                            <input
                                type="password"
                                name="password"
                                placeholder="Password (min 6 chars)"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                                minLength={6}
                                autoComplete="new-password"
                            />

                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                required
                                minLength={6}
                                autoComplete="new-password"
                            />

                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                className="auth-select"
                            >
                                <option value="user">Buyer / Renter</option>
                                <option value="agent">Real Estate Agent</option>
                                <option value="seller">Property Seller</option>
                            </select>

                            {error && isSignUp && (
                                <p className="auth-error-msg">{error}</p>
                            )}

                            <button type="submit" disabled={loading} className="auth-submit-btn">
                                {loading ? 'Signing Up...' : 'Sign Up'}
                            </button>

                            {/* Mobile inline switch link */}
                            <div className="mobile-switch-prompt">
                                <span>Already have an account? </span>
                                <button 
                                    type="button" 
                                    className="switch-link-btn"
                                    onClick={() => switchMode(false)}
                                >
                                    Sign In
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* SIGN IN */}
                    <div className="form-container sign-in">
                        <form onSubmit={handleSubmit}>
                            <h1>Sign In</h1>
                            <SocialIcons />
                            <span>or use your email password</span>

                            {successMessage && !isSignUp && (
                                <p className="auth-success-msg">{successMessage}</p>
                            )}

                            <input
                                type="email"
                                name="email"
                                placeholder="Email address"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                autoComplete="email"
                            />

                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                                autoComplete="current-password"
                            />

                            <a href="#" className="forgot-pass-link">Forgot Your Password?</a>

                            {error && !isSignUp && (
                                <p className="auth-error-msg">{error}</p>
                            )}

                            <button type="submit" disabled={loading} className="auth-submit-btn">
                                {loading ? 'Signing In...' : 'Sign In'}
                            </button>

                            {/* Mobile inline switch link */}
                            <div className="mobile-switch-prompt">
                                <span>Don't have an account? </span>
                                <button 
                                    type="button" 
                                    className="switch-link-btn"
                                    onClick={() => switchMode(true)}
                                >
                                    Sign Up
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* DESKTOP TOGGLE SLIDER */}
                    <div className="toggle-container">
                        <div className="toggle">
                            <div className="toggle-panel toggle-left">
                                <h1>Welcome Back!</h1>
                                <p>Access your dashboard and manage your verified properties with ease.</p>
                                <button type="button" className="hidden" onClick={() => switchMode(false)}>
                                    Sign In
                                </button>
                            </div>

                            <div className="toggle-panel toggle-right">
                                <h1>New Here?</h1>
                                <p>Join SuDomus today to discover and list premium verified properties.</p>
                                <button type="button" className="hidden" onClick={() => switchMode(true)}>
                                    Sign Up
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}


