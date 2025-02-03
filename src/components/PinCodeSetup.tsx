import { useState} from "react";
import {Box, Grid, Typography} from "@mui/material";
import PinInput from "react-pin-input";
import {savePinToDB} from "../utils/db";
import {SHA256} from "crypto-js";
import {encryptPin, generateIV, generateSalt} from "../utils/helpers.ts";

const PinCodeSetup: React.FC<{ onComplete: () => void }> = ({onComplete}) => {

    let ele: PinInput | null;
    const [confirmPin, setConfirmPin] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);


    const handlePinComplete = async (value: string) => {
        if (!confirmPin) {
            setConfirmPin(value);
            setError(null);
            ele?.clear()
        } else {
            if (value === confirmPin) {
                const salt = generateSalt();
                const iv = generateIV()
                const pin = SHA256(value).toString()
                const encrypted = await encryptPin(pin, salt, iv);
                savePinToDB({
                    salt,
                    iv,
                    encryptedPin: encrypted,
                });
                onComplete();
            } else {
                setError("PIN-коды не совпадают, попробуйте снова.");
                setConfirmPin(null);
            }
        }
    };

    return (
        <Box textAlign="center">
            <Typography variant="h5">
                {confirmPin ? "Подтвердите PIN-код" : "Задайте 5-значный PIN-код"}
            </Typography>
            <Grid container justifyContent="center" mt={2}>
                <PinInput
                    ref={(n) => ele = n}
                    length={5}
                    focus
                    secret
                    type="numeric"
                    inputMode="number"
                    onComplete={handlePinComplete}
                />
            </Grid>
            {error && <Typography color="error">{error}</Typography>}
        </Box>
    );
};

export default PinCodeSetup;
