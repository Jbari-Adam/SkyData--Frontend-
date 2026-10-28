import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './auth/useAuth'
import { authService } from './services/authService'
import SettingsPanel from './SettingsPanel'
import './css/Profile.css'

function getErrorMessage(error, fallback) {
    const errors = error.response?.data?.errors
    const firstValidationError = errors ? Object.values(errors).flat()[0] : null
    return firstValidationError || error.response?.data?.message || fallback
}

export default function Profile() {
    const navigate = useNavigate()
    const { user, setUser } = useAuth()
    const [name, setName] = useState(user?.name || '')
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [isSendingReset, setIsSendingReset] = useState(false)
    const [resetMessage, setResetMessage] = useState('')
    const [temperatureUnit, setTemperatureUnit] = useState(() => localStorage.getItem('temperature_unit') || 'C')
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('dark_mode') === 'true')
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    const updateTemperatureUnit = (unit) => {
        setTemperatureUnit(unit)
        localStorage.setItem('temperature_unit', unit)
    }

    const toggleDarkMode = () => {
        setIsDarkMode((current) => {
            localStorage.setItem('dark_mode', String(!current))
            return !current
        })
    }

    const updateProfile = async (event) => {
        event.preventDefault()
        setIsSaving(true)
        setMessage('')
        setError('')

        try {
            const response = await authService.handleUpdateProfile({ name: name.trim() })
            setUser(response.user)
            setMessage(response.message || 'Profile updated successfully.')
        } catch (requestError) {
            setError(getErrorMessage(requestError, 'Unable to update your profile.'))
        } finally {
            setIsSaving(false)
        }
    }

    const sendPasswordReset = async () => {
        setIsSendingReset(true)
        setResetMessage('')
        setError('')

        try {
            const response = await authService.handleForgotPassword(user.email)
            setResetMessage(response.message || 'Check your email for a password reset link.')
        } catch (requestError) {
            setError(getErrorMessage(requestError, 'Unable to send a reset link.'))
        } finally {
            setIsSendingReset(false)
        }
    }

    return (
        <main className={`profile-page ${isDarkMode ? 'dark-mode' : ''}`}>
            <header className="profile-header">
                <div>
                    <p className="profile-eyebrow">Account</p>
                    <h1>Your profile</h1>
                    <p>Keep your SkyData account details up to date.</p>
                </div>
                <div className="profile-header-actions">
                    <button className="profile-settings-button" type="button" onClick={() => setIsSettingsOpen(true)}>Settings</button>
                    <button className="profile-back-button" type="button" onClick={() => navigate('/home')}>Back to dashboard</button>
                </div>
            </header>

            <section className="profile-grid">
                <article className="profile-card">
                    <div className="profile-card-heading">
                        <div className="profile-avatar">{user?.name?.charAt(0).toUpperCase() || 'A'}</div>
                        <div>
                            <p className="profile-eyebrow">Personal details</p>
                            <h2>Profile information</h2>
                        </div>
                    </div>

                    <form onSubmit={updateProfile} className="profile-form">
                        <label htmlFor="profile-name">Name</label>
                        <input id="profile-name" type="text" value={name} onChange={(event) => setName(event.target.value)} maxLength="255" required autoComplete="name" />

                        <label htmlFor="profile-email">Email address</label>
                        <input id="profile-email" type="email" value={user?.email || ''} readOnly aria-describedby="profile-email-note" />
                        <small id="profile-email-note">Email changes require a separate verification flow.</small>

                        <button className="profile-primary-button" type="submit" disabled={isSaving || !name.trim()}>
                            {isSaving ? 'Saving...' : 'Save changes'}
                        </button>
                        {message && <p className="profile-success" role="status">{message}</p>}
                    </form>
                </article>

                <article className="profile-card security-card">
                    <p className="profile-eyebrow">Security</p>
                    <h2>Password reset</h2>
                    <p>Send a secure password reset link to your verified email address.</p>
                    <button className="profile-secondary-button" type="button" onClick={sendPasswordReset} disabled={isSendingReset}>
                        {isSendingReset ? 'Sending...' : 'Email me a reset link'}
                    </button>
                    {resetMessage && <p className="profile-success" role="status">{resetMessage}</p>}
                    {error && <p className="profile-error" role="alert">{error}</p>}
                </article>
            </section>

            {isSettingsOpen && <SettingsPanel
                temperatureUnit={temperatureUnit}
                onTemperatureUnitChange={updateTemperatureUnit}
                isDarkMode={isDarkMode}
                onToggleDarkMode={toggleDarkMode}
                onClose={() => setIsSettingsOpen(false)}
            />}
        </main>
    )
}
