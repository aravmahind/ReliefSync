import { useState } from "react";
import axios from 'axios';

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [registerFlag, setRegisterFlag] = useState(false);
    const [userEmail, setUserEmail] = useState("");

    const registerUser = async () => {
        if(password != confirmPassword) {
            alert("Password not matching");
            return;
        }
        try {
            const response = await axios.post("http://localhost:5000/api/registerUser", {
                "email": email,
                "password": password,
                "confirmPassword": confirmPassword
            });
    
            setUserEmail(response.data.uemail);
        }
        catch(error) {
            console.log(error);
        }
    }

    const checkLogin = () => {
        
    }

    return (
        <>
            {!registerFlag && <form>
                <input type="text" placeholder="Enter your email" onChange={(e) => setEmail(e.target.value)} required/>
                <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required/>
                <button type="button" onClick={checkLogin}>Login</button>
                <button type="button" onClick={() => setRegisterFlag(true)}>Register</button>  
            </form>}
            {registerFlag && <form>
                <input type="text" placeholder="Enter your email" onChange={(e) => setEmail(e.target.value)} required/>
                <input type="password" placeholder="Create Password" onChange={(e) => setPassword(e.target.value)} required/>
                <input type="password" placeholder="Confirm Password" onChange={(e) => setConfirmPassword(e.target.value)} required/>
                <button type="button" onClick={registerUser}>Register</button>
                <button type="button" onClick={() => setRegisterFlag(false)}>Login</button>
            </form>}

            <h2>{userEmail}</h2>
        </>
    );
}

export default LoginPage;