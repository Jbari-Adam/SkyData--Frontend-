import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authService } from './services/authService'
import './css/Profile.css'

export default function ResetPassword() {
    const [searchParams] = useSearchParams()
    const [password, setPassword] = useState('')
    const [passwordConfirmation, setPasswordConfirmation] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [isResetting, setIsResetting] = useState(false)

    const submitReset = async (event) => {
        event.preventDefault()
        setIsResetting(true)
        setMessage('')
        setError('')

        try {
            const response = await authService.handleResetPassword({
                token: searchParams.get('token') || '',
                email: searchParams.get('email') || '',
                password,
                password_confirmation: passwordConfirmation,
            })
            setMessage(response.message || 'Your password has been reset successfully.')
            setPassword('')
            setPasswordConfirmation('')
        } catch (requestError) {
            const errors = requestError.response?.data?.errors
            const firstValidationError = errors ? Object.values(errors).flat()[0] : null
            setError(firstValidationError || requestError.response?.data?.message || 'This reset link is invalid or expired.')
        } finally {
            setIsResetting(false)
        }
    }

    const hasResetToken = searchParams.has('token') && searchParams.has('email')

    return (
        <main className="profile-page auth-utility-page">
            <section className="utility-card">
                <p className="profile-eyebrow">Account recovery</p>
                <h1>Choose a new password.</h1>
                <p>Your new password must be at least six characters long.</p>
                {hasResetToken ? (
                    <form className="profile-form" onSubmit={submitReset}>
                        <label htmlFor="reset-password">New password</label>
                        <input id="reset-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength="6" required autoComplete="new-password" />
                        <label htmlFor="reset-password-confirmation">Confirm new password</label>
                        <input id="reset-password-confirmation" type="password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} minLength="6" required autoComplete="new-password" />
                        <button className="profile-primary-button" type="submit" disabled={isResetting}>
                            {isResetting ? 'Resetting...' : 'Reset password'}
                        </button>
                    </form>
                ) : (
                    <p className="profile-error" role="alert">This password reset link is incomplete.</p>
                )}
                {message && <p className="profile-success" role="status">{message}</p>}
                {error && <p className="profile-error" role="alert">{error}</p>}
                <Link className="utility-link" to="/login">Back to sign in</Link>
            </section>
        </main>
    )
}
