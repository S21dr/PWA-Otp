import {useState} from 'react'
import './App.css'
import OTPGenerator from "./components/OTPGenerator.tsx";
import Auth from "./components/Auth.tsx";

function App() {

    const [authenticated, setAuthenticated] = useState<boolean>(false);
    const handleChangeAuth = (auth:boolean) => {
      setAuthenticated(auth)
    }

    return (
        <div>
            <h2>🔐 PWA OTP</h2>
            {
                authenticated ? <OTPGenerator/>
                    : <Auth handleChangeAuth={handleChangeAuth}/>
            }
        </div>
    )
}

export default App
