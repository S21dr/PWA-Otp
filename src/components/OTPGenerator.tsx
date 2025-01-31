//import { authenticator } from "otplib";
import {useEffect, useState} from "react";

const OTPGenerator: React.FC = () => {
    const [otp, setOtp] = useState<string | null>(null);

    const fetchOTP = async () => {
        try {
            const res = await fetch("/api/otp");
            const data = await res.json();
            setOtp(data.otp);
        } catch (error) {
            setOtp("Ошибка получения OTP");
        }
    };

    useEffect(() => {
        fetchOTP()
    }, []);



    return (
        <div>
            {otp && <p>Ваш OTP: {otp}</p>}
        </div>
    );
};

export default OTPGenerator;