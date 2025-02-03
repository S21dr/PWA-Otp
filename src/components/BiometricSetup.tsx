import { Box, Button, Typography } from "@mui/material";
import { saveBiometricSetting } from "../utils/db";
import {registerBiometric} from "../utils/helpers.ts";

const BiometricSetup: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const handleEnableBiometrics = async () => {
        try {
            const success = await registerBiometric();
            if (success) {
                saveBiometricSetting(true);
                onComplete();
            } else {
                alert("Ошибка регистрации биометрии.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSkip = () => {
        saveBiometricSetting(false);
        onComplete();
    };

    return (
        <Box textAlign="center">
            <Typography variant="h5" sx={{ mt: 3 }}>Включить вход по биометрии?</Typography>
            <div>
                <Button variant="contained" onClick={handleEnableBiometrics} sx={{ mt: 2 }}>
                    Включить
                </Button>
            </div>
           <div>
               <Button variant="text" onClick={handleSkip} sx={{ mt: 1 }}>
                   Не включить
               </Button>
           </div>

        </Box>
    );
};

export default BiometricSetup;
