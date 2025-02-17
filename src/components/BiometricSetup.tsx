import { Box, Button, Typography } from "@mui/material";
import { registerBiometric} from "../utils/helpers.ts";
import {setItem} from "../utils/db.ts";
import {setRawId} from "../store/idbSlice.ts";

const BiometricSetup: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const handleEnableBiometrics = async () => {
        try {
            const rawId = await registerBiometric();
            if (rawId) {
                setRawId(new Uint8Array(rawId));
                await setItem("settings", "rawId", new Uint8Array(rawId))
                onComplete();
            } else {
                alert(`"Ошибка получения rawId:${JSON.stringify(rawId)}`);
            }
        } catch (error) {
            alert(`"Ошибка регистрации биометрии:${JSON.stringify(error)}`);
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
