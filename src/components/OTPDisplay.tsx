import {useEffect, useState} from "react";
import {Box, Typography, Button} from "@mui/material";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import {authenticator} from "@otplib/preset-browser";
const OTPDisplay: React.FC = () => {
    const [otp, setOtp] = useState<string>("");

    useEffect(() => {
        const secret = "KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLD"; // Генерировать динамически
        setOtp(authenticator.generate(secret));
    }, []);

    return (
        <Box textAlign="center">
            <Typography variant="h5">Ваш OTP-код:</Typography>
            <Typography variant="h4" color="primary" sx={{mt: 2}}>
                {otp}
            </Typography>
            <Button variant="contained" sx={{mt: 2}} onClick={() => navigator.clipboard.writeText(otp)}>
                Копировать
            </Button>
        </Box>
    );
};

export default OTPDisplay;
