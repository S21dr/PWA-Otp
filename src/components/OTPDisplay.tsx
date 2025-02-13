import {useEffect, useState} from "react";
import {Box, Typography, Button} from "@mui/material";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import {authenticator} from "@otplib/preset-browser";
import {fetchSeed} from "../utils/helpers.ts";

const OTPDisplay: React.FC = () => {
    const [otp, setOtp] = useState<string>("");
    const [loadOtp, setLoadOtp] = useState(false)

    const onMount = async () => {
        setLoadOtp(true)
        const secret = await fetchSeed()
        setOtp(authenticator.generate(secret));
        setLoadOtp(false)
    }

    useEffect(() => {
        onMount()
    }, []);

    return (
        <Box textAlign="center">
            <Typography variant="h5">Ваш OTP-код:</Typography>
            {
                loadOtp ? <Typography variant="h4" color="primary" sx={{mt: 2}}>
                    Loading ...
                </Typography> : <Typography variant="h4" color="primary" sx={{mt: 2}}>
                    {otp}
                </Typography>
            }

            <Button variant="contained" sx={{mt: 2}} onClick={() => navigator.clipboard.writeText(otp)}>
                Копировать
            </Button>
        </Box>
    );
};

export default OTPDisplay;
