import React, { useState } from "react"
import './css/App.css'
import weatherIcon from './assets/weather-icon-auth.webp'
import axios from "axios";

//Configure Axios to work with Laravel Sanctum
axios.defaults.withCredentials = true; // Crucial for sending cookies
axios.defaults.baseURL = "http://localhost:8000";

export default function Auth() {
    //Login
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    //Register
    const [registerName, setregisterName] = useState('');
    const [registerEmail, setregisterEmail] = useState('');
    const [registerPassword, setregisterPassword] = useState('');
    const [showRegister, setShowRegister] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        
        try {
            //ask Laravel for a CSRF token
            await axios.get("/sanctum/csrf-cookie");

        } catch (error) {
            console.log('somthing went wrong', error)
        }
    }

    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            //ask Laravel for a CSRF token
            await axios.get("/sanctum/csrf-cookie");

        } catch (error) {
            console.log('somthing went wrong', error)
        }

    }


    return (
        <div className="auth-div">
            <div className={`countainer ${showRegister ? 'show-register' : ''}`}>
                <div className="mobile-brand">
                    <img src={weatherIcon} alt="Sunny weather" />
                </div>
                <div className={`hider ${showRegister ? 'show-register' : ''}`}>
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

                <div className="login">
                    <form onSubmit={handleLogin}>
                        <p className="form-kicker">SIGN IN</p>
                        <h1>Good to see you.</h1>
                        <p className="form-intro">Sign in to continue to your dashboard.</p>
                        <label htmlFor="login-email">Email address</label>
                        <input id="login-email" type="email" placeholder="you@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                        <label htmlFor="login-password">Password</label>
                        <input id="login-password" type="password" placeholder="Enter your password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                        <button className="primary-button">Sign in</button>
                        <button className="switch-button" type="button" onClick={() => setShowRegister(true)}>Create an account <span>-&gt;</span></button>
                    </form>
                </div>

                <div className="register">
                    <form onSubmit={handleRegister}>
                        <p className="form-kicker">NEW HERE?</p>
                        <h1>Start fresh.</h1>
                        <p className="form-intro">Build a clearer view of everything that matters.</p>
                        <label htmlFor="register-name">Name</label>
                        <input id="register-name" type="text" placeholder="Your name" value={registerName} onChange={(e) => setregisterName(e.target.value)} />
                        <label htmlFor="register-email">Email address</label>
                        <input id="register-email" type="email" placeholder="you@example.com" value={registerEmail} onChange={(e) => setregisterEmail(e.target.value)} />
                        <label htmlFor="register-password">Password</label>
                        <input id="register-password" type="password" placeholder="Create a password" value={registerPassword} onChange={(e) => setregisterPassword(e.target.value)} />
                        <button className="primary-button">Create account</button>
                        <button className="switch-button" type="button" onClick={() => setShowRegister(false)}>Already a member? <span>Sign in</span></button>
                    </form>
                </div>
            </div>
        </div>
    )
}