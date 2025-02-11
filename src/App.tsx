import {useEffect, useState} from "react";
import {Box, Button, Container, Typography} from "@mui/material";
//import PinCodeSetup from "./components/PinCodeSetup";
import BiometricSetup from "./components/BiometricSetup";
import OTPDisplay from "./components/OTPDisplay";
import {getBiometricSetting, getStoredPin, saveBiometricSetting, savePinToDB} from "./utils/db";
import {decryptPin, encryptPin, saveLargeBlob, tryBiometricLogin} from "./utils/helpers.ts";
//import PinCodeCheck from "./components/PinCodeCheck.tsx";

const App: React.FC = () => {
    const [step, setStep] = useState<number>(0);
    const [loadApp, setLoadApp] = useState(true)

    //const [decryptedPin, setDecryptedPin] = useState("")

    const logInBio = async () => {
        try {
            const biometricEnabled = await getBiometricSetting();
            if (!biometricEnabled) {
                const largeBlob = await saveLargeBlob()
                if (largeBlob) {
                    const pin = "someSecretString"
                    const encrypted = await encryptPin(pin, largeBlob.salt, largeBlob.iv);
                    savePinToDB({
                        encryptedPin: encrypted,
                    });
                    saveBiometricSetting(true);
                    setStep(3);
                }
            } else {
                const biometricSuccess = await tryBiometricLogin();

                if (biometricSuccess) {
                    const {encryptedPin} = await getStoredPin();
                    const decrypt = await decryptPin({
                        encryptedPin,
                        salt: biometricSuccess.salt,
                        iv: biometricSuccess.iv
                    })
                    alert(`decrypt:${decrypt}`)
                    setStep(3);
                } else {
                    setStep(2)
                }
            }
        } catch (e) {
            setStep(2)
            alert(e)
        }

    }

    useEffect(() => {
        const init = async () => {
            //const pin = await getStoredPin();
            const biometricEnabled = await getBiometricSetting();
            if (biometricEnabled === undefined) {
                setStep(1)
            }
            if (biometricEnabled) {
                await logInBio()
            }
            // if (pin?.encryptedPin) {
            //     const decrypt = await decryptPin(pin)
            //     setDecryptedPin(decrypt)
            //
            // } else {
            //     setStep(2)
            // }
        };
        init().then(() => setLoadApp(false));
    }, []);

    return (
        <Container>
            <Typography variant="h3" style={{textAlign: "center", color: "#148f2a"}}>
                PWA OTP
            </Typography>
            {loadApp ? <Typography variant="h5">
                    Load app ...
                </Typography>
                : <Box mt={5}>
                    {step === 1 && <BiometricSetup onComplete={() => setStep(2)}/>}
                    {step === 2 && <Box textAlign="center">
                        <Typography variant="h5" sx={{mt: 3}}>Вход по биометрии</Typography>
                        <div>
                            <Button variant="contained" onClick={logInBio} sx={{mt: 2}}>
                                Войти
                            </Button>
                        </div>
                    </Box>}
                    {/*{step === 0 && <PinCodeCheck onComplete={() => setStep(3)} decryptedPin={decryptedPin}/>}*/}
                    {/*{step === 2 && <PinCodeSetup onComplete={() => setStep(3)}/>}*/}
                    {step === 3 && <OTPDisplay/>}
                </Box>}
        </Container>
    );
};

export default App;
