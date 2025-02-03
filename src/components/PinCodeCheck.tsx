import { useState} from "react";
import {Box, Grid, Typography} from "@mui/material";
import PinInput from "react-pin-input";
import {SHA256} from "crypto-js";

const PinCodeCheck: React.FC<{ onComplete: () => void, decryptedPin: string }> = ({onComplete, decryptedPin}) => {

    let ele: PinInput | null;
    const [error, setError] = useState<string | null>(null);

    const handlePinComplete = (value: string) => {
        if (decryptedPin === SHA256(value).toString()) {
            onComplete()
        } else {
            ele?.clear()
            setError("Неверный пин-код");
        }
    };

    return (
        <Box textAlign="center">
            <Typography variant="h5">
                Введите 5-значный PIN-код
            </Typography>
            <Grid container justifyContent="center" mt={2}>
                <PinInput
                    ref={(n) => ele = n}
                    length={5}
                    focus
                    secret
                    type="numeric"
                    inputMode="tel"
                    onComplete={handlePinComplete}
                    autoSelect={false}
                />
            </Grid>
            {error && <Typography color="error">{error}</Typography>}
        </Box>
    );
};

export default PinCodeCheck;
