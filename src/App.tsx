import {useEffect, useState} from "react";
import {Box, Container, Typography} from "@mui/material";
import PinCodeSetup from "./components/PinCodeSetup";
import BiometricSetup from "./components/BiometricSetup";
import OTPDisplay from "./components/OTPDisplay";
import {getStoredPin, getBiometricSetting} from "./utils/db";
import {decryptPin, tryBiometricLogin} from "./utils/helpers.ts";
import PinCodeCheck from "./components/PinCodeCheck.tsx";

const App: React.FC = () => {
    const [step, setStep] = useState<number>(0);
    const [loadApp, setLoadApp] = useState(true)
    const [decryptedPin, setDecryptedPin] = useState("")

    useEffect(() => {
        const init = async () => {
            const pin = await getStoredPin();
            if (pin?.encryptedPin) {
                const decrypt = await decryptPin(pin)
                setDecryptedPin(decrypt)
                const biometricEnabled = await getBiometricSetting();
                if (biometricEnabled === undefined) {
                    setStep(2)
                }
                if (biometricEnabled) {
                    const biometricSuccess = await tryBiometricLogin();
                    if (biometricSuccess) {
                        setStep(3);
                    }
                }
            } else {
                setStep(1)
            }
        };
        init().then(() => setLoadApp(false));
    }, []);

    return (
        <Container>
            <Typography variant="h3" style={{textAlign: "center",color:"#148f2a"}}>
                PWA OTP
            </Typography>
            {loadApp ? <Typography variant="h5">
                    Load app ...
                </Typography>
                : <Box mt={5}>
                    {step === 0 && <PinCodeCheck onComplete={() => setStep(3)} decryptedPin={decryptedPin}/>}
                    {step === 1 && <PinCodeSetup onComplete={() => setStep(2)}/>}
                    {step === 2 && <BiometricSetup onComplete={() => setStep(3)}/>}
                    {step === 3 && <OTPDisplay/>}
                </Box>}
        </Container>
    );
};

export default App;
