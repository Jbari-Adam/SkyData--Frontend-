import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from './services/authService'
import './css/Profile.css'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [isSending, setIsSending] = useState(false)

    const submitRequest = async (event) => {
        event.preventDefault()
        setIsSending(true)
        setMessage('')
        setError('')

        try {
            const response = await authService.handleForgotPassword(email)
            setMessage(response.message || 'Check your email for a password reset link.')
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to send a reset link right now.')
        } finally {
            setIsSending(false)
        }
    }

    return (
        <main className="profile-page auth-utility-page">
            <section className="utility-card">
                <p className="profile-eyebrow">Account recovery</p>
                <h1>Reset your password.</h1>
                <p>Enter your email and we will send you a secure reset link.</p>
                <form className="profile-form" onSubmit={submitRequest}>
                    <label htmlFor="forgot-email">Email address</label>
                    <input id="forgot-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
                    <button className="profile-primary-button" type="submit" disabled={isSending}>
                        {isSending ? 'Sending...' : 'Send reset link'}
                    </button>
                </form>
                {message && <p className="profile-success" role="status">{message}</p>}
                {error && <p className="profile-error" role="alert">{error}</p>}
                <Link className="utility-link" to="/login">Back to sign in</Link>
            </section>
        </main>
    )
}
