import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import weatherIcon from './assets/weather-icon-auth.webp'
import { useAuth } from './auth/useAuth'
import { authService } from './services/authService'
import './css/App.css'

function getErrorMessage(error, fallback) {
    const errors = error.response?.data?.errors
    const firstValidationError = errors ? Object.values(errors).flat()[0] : null
    return firstValidationError || error.response?.data?.message || fallback
}

export default function Auth() {
    const navigate = useNavigate()
    const { setUser } = useAuth()
    const [loginEmail, setLoginEmail] = useState('')
    const [loginPassword, setLoginPassword] = useState('')

    const [registerName, setRegisterName] = useState('')
    const [registerEmail, setRegisterEmail] = useState('')
    const [registerPassword, setRegisterPassword] = useState('')

    const [showRegister, setShowRegister] = useState(false)
    const [showVerification, setShowVerification] = useState(false)
    const [verificationEmail, setVerificationEmail] = useState('')
    const [verificationCode, setVerificationCode] = useState('')
    const [verificationMessage, setVerificationMessage] = useState('')
    const [authMessage, setAuthMessage] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [isResending, setIsResending] = useState(false)

    const user = {
        email: loginEmail,
        password: loginPassword,
    }

    const registerUser = {
        name: registerName,
        email: registerEmail,
        password: registerPassword,
        password_confirmation: registerPassword,
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        setIsProcessing(true)
        setAuthMessage('')

        try {
            const login = await authService.handleLogin(user)

            if (login) {
                setVerificationEmail(login.email)
                setVerificationCode('')
                setVerificationMessage('')
                setShowVerification(true)
            }
        } catch (error) {
            setAuthMessage(getErrorMessage(error, 'Unable to sign in. Check your details and try again.'))
        } finally {
            setIsProcessing(false)
        }
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        setIsProcessing(true)
        setAuthMessage('')

        try {
            const register = await authService.handleRegister(registerUser)

            if (register) {
                setVerificationEmail(register.email)
                setVerificationCode('')
                setVerificationMessage('')
                setShowVerification(true)
            }
        } catch (error) {
            setAuthMessage(getErrorMessage(error, 'Unable to create your account. Please try again.'))
        } finally {
            setIsProcessing(false)
        }
    }

    const handleVerification = async (e) => {
        e.preventDefault()
        setIsProcessing(true)
        setVerificationMessage('')

        try {
            const verifiedUser = await authService.handleVerifyMail(verificationEmail, verificationCode)
            setUser(verifiedUser)
            navigate('/home', { replace: true })
        } catch (error) {
            setVerificationMessage(getErrorMessage(error, 'Verification failed.'))
        } finally {
            setIsProcessing(false)
        }
    }

    const handleResendVerification = async () => {
        setIsResending(true)
        setVerificationMessage('')

        try {
            const response = await authService.handleResendVerification(verificationEmail)
            setVerificationMessage(response.message || 'A new verification code has been sent.')
        } catch (error) {
            setVerificationMessage(getErrorMessage(error, 'Unable to resend the code right now.'))
        } finally {
            setIsResending(false)
        }
    }

    return (
        <div className="auth-div">
            {isProcessing && <div className="processing-backdrop" aria-label="Processing request" />}
            <div className={`countainer ${showRegister ? 'show-register' : ''}`}>
                <div className="mobile-brand">
                    <img src={weatherIcon} alt="Sunny weather" />
                </div>
                <div className={`hider ${showRegister ? 'show-register' : ''} ${showVerification ? 'is-verification' : ''}`}>
                    {!showVerification ? (
                        <div className="hider-content">
                            <span className="hider-mark">
                                <img src={weatherIcon} alt="Sunny weather" />
                            </span>
                            <p className="hider-kicker">SkyData</p>
                            <h2>{showRegister ? 'Your data, in orbit.' : 'Welcome back.'}</h2>
                            <p className="hider-copy">
                                {showRegister
                                    ? 'Create your account and make every insight count.'
                                    : 'Pick up where you left off and keep your data moving.'}
                            </p>
                        </div>
                    ) : (
                        <div className="verification-content">
                            <p className="hider-kicker">ONE LAST STEP</p>
                            <h2>Check your inbox.</h2>
                            <p className="hider-copy">Enter the verification code sent to {verificationEmail}.</p>
                            <form onSubmit={handleVerification} className="verification-form">
                                <label htmlFor="verification-code">Verification code</label>
                                <input
                                    id="verification-code"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength="6"
                                    placeholder="000000"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    pattern="[0-9]{6}"
                                    required
                                />
                                <button className="verification-button" disabled={isProcessing}>
                                    {isProcessing ? 'Processing...' : 'Verify email'}
                                </button>
                                <button className="resend-button" type="button" onClick={handleResendVerification} disabled={isResending || isProcessing}>
                                    {isResending ? 'Sending...' : 'Resend code'}
                                </button>
                                {verificationMessage && <p className="verification-message" role="alert">{verificationMessage}</p>}
                            </form>
                        </div>
                    )}
                </div>

                <div className="login">
                    <form onSubmit={handleLogin}>
                        <p className="form-kicker">SIGN IN</p>
                        <h1>Good to see you.</h1>
                        <p className="form-intro">Sign in to continue to your dashboard.</p>
                        <label htmlFor="login-email">Email address</label>
                        <input id="login-email" type="email" placeholder="you@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required autoComplete="email" />
                        <label htmlFor="login-password">Password</label>
                        <input id="login-password" type="password" placeholder="Enter your password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required autoComplete="current-password" />
                        <button className="forgot-password-link" type="button" onClick={() => navigate('/forgot-password')}>Forgot password?</button>
                        <button className="primary-button" disabled={isProcessing}>
                            {isProcessing ? 'Processing...' : 'Sign in'}
                        </button>
                        {authMessage && !showRegister && <p className="auth-error" role="alert">{authMessage}</p>}
                        <button className="switch-button" type="button" onClick={() => setShowRegister(true)}>Create an account <span>-&gt;</span></button>
                    </form>
                </div>

                <div className="register">
                    <form onSubmit={handleRegister}>
                        <p className="form-kicker">NEW HERE?</p>
                        <h1>Start fresh.</h1>
                        <p className="form-intro">Build a clearer view of everything that matters.</p>
                        <label htmlFor="register-name">Name</label>
                        <input id="register-name" type="text" placeholder="Your name" value={registerName} onChange={(e) => setRegisterName(e.target.value)} required autoComplete="name" />
                        <label htmlFor="register-email">Email address</label>
                        <input id="register-email" type="email" placeholder="you@example.com" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} required autoComplete="email" />
                        <label htmlFor="register-password">Password</label>
                        <input id="register-password" type="password" placeholder="Create a password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} required minLength="6" autoComplete="new-password" />
                        <button className="primary-button" disabled={isProcessing}>
                            {isProcessing ? 'Processing...' : 'Create account'}
                        </button>
                        {authMessage && showRegister && <p className="auth-error" role="alert">{authMessage}</p>}
                        <button className="switch-button" type="button" onClick={() => setShowRegister(false)}>Already a member? <span>Sign in</span></button>
                    </form>
                </div>
            </div>
        </div>
    )
}
