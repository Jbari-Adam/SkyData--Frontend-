import React, { useState } from "react"
import axios from "axios"


export default function Auth() {
    //Login
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    //Register
    const [registerName, setregisterName] = useState('');
    const [registerEmail, setLoginEmail] = useState('');
    const [registerPassword, setLoginPassword] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
    }

    const handleRegister = (e) => {
        e.preventDefault();
    }


    return (
        <>
            <div>
                <div>
                    <form onSubmit={handleLogin}>
                        <label>Email :</label><br />
                        <input type="email" placeholder="Enter your Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} /><br />

                        <label>Password</label><br />
                        <input type="password" placeholder="Enter your password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} /><br />

                        <button>Login</button>
                    </form>
                </div>

                <div>
                    <form onSubmit={handleRegister}>
                        <label>Name :</label><br />
                        <input type="text" placeholder="Enter your Name" /><br />

                        <label>Email :</label><br />
                        <input type="email" placeholder="Enter your Email" /><br />

                        <label>Password</label><br />
                        <input type="password" placeholder="Enter your password" /><br />

                        <button>Register</button>
                    </form>
                </div>
            </div>
        </>
    )
}