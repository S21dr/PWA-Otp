import { Box, Button, Typography } from "@mui/material";
import { registerBiometric} from "../utils/helpers.ts";

const BiometricSetup: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const handleEnableBiometrics = async () => {
        try {
            const success = await registerBiometric();
            if (success) {
                onComplete();
            } else {
                alert("Ошибка регистрации биометрии.");
            }
        } catch (error) {
            console.error(error);
        }
    };


    return (
        <Box textAlign="center">
            <Typography variant="h5" sx={{ mt: 3 }}>Включить вход по биометрии?</Typography>
            <div>
                <Button variant="contained" onClick={handleEnableBiometrics} sx={{ mt: 2 }}>
                    Включить
                </Button>
            </div>
        </Box>
    );
};

export default BiometricSetup;
