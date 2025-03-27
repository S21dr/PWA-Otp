import {FC, useEffect, useState} from "react";
import {Box, Container, FormControl, FormControlLabel, Radio, RadioGroup, Typography} from "@mui/material";
import BiometricSetup from "./components/BiometricSetup";
import OTPDisplay from "./components/OTPDisplay";
import BiometricLogIn from "./components/BiometricLogIn.tsx";
import {RootState, store} from "./store";

const App: FC = () => {
    const [step, setStep] = useState<number>(1);
    const rawId = (store.getState() as RootState).idb.rawId

    const [value, setValue] = useState('_self');

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue((event.target as HTMLInputElement).value);
    };

    useEffect(() => {
        if (rawId) {
            setStep(2)
        }
    }, [rawId]);

    return (
        <Container>
            <Typography variant="h3" style={{textAlign: "center", color: "#148f2a"}}>
                PWA OTP
            </Typography>

            <div>
                <a target={value} href="https://pwatestmvp.ru">pwatestmvp.ru</a>
            </div>
            <FormControl style={{marginBottom:64}}>
                <RadioGroup
                    aria-labelledby="demo-controlled-radio-buttons-group"
                    name="controlled-radio-buttons-group"
                    value={value}
                    onChange={handleChange}
                >
                    <FormControlLabel value="_self" control={<Radio />} label="default" />
                    <FormControlLabel value="_blank" control={<Radio />} label="blank" />
                    <FormControlLabel value="_parent" control={<Radio />} label="parent" />
                    <FormControlLabel value="_top" control={<Radio />} label="top" />
                </RadioGroup>
            </FormControl>

            <Box mt={5}>
                {step === 1 && <BiometricSetup onComplete={() => setStep(2)}/>}
                {step === 2 && <BiometricLogIn onComplete={() => setStep(3)}/>}
                {step === 3 && <OTPDisplay hideOtp={() => setStep(3)}/>}
            </Box>
        </Container>
    );
};

export default App;
