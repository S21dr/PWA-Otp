import {FC, useEffect, useState} from "react";
import {Box, Container, Typography} from "@mui/material";
import BiometricSetup from "./components/BiometricSetup";
import OTPDisplay from "./components/OTPDisplay";
import BiometricLogIn from "./components/BiometricLogIn.tsx";
import {RootState, store} from "./store";

const App: FC = () => {
    const [step, setStep] = useState<number>(1);
    const rawId = (store.getState() as RootState).idb.rawId


    useEffect(() => {
        if (rawId.length) {
            setStep(2)
        }
    }, [rawId]);

    return (
        <Container>
            <Typography variant="h3" style={{textAlign: "center", color: "#148f2a"}}>
                PWA OTP
            </Typography>

            <Box mt={5}>
                {step === 1 && <BiometricSetup onComplete={() => setStep(2)}/>}
                {step === 2 && <BiometricLogIn onComplete={() => setStep(3)}/>}
                {step === 3 && <OTPDisplay/>}
            </Box>
        </Container>
    );
};

export default App;
