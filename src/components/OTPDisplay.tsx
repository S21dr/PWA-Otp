import {useCallback, useEffect, useState} from "react";
import {Box, Typography, Button, Radio, FormControl, RadioGroup, FormControlLabel} from "@mui/material";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import {authenticator} from "@otplib/preset-browser";
import {decrypt, encrypt, fetchSeed} from "../utils/helpers.ts";
import {store} from "../store";
import {setItem} from "../utils/db.ts";

const OTPDisplay: React.FC<{ hideOtp: () => void }> = ({hideOtp}) => {
    const [otp, setOtp] = useState<string>("");
    const [loadOtp, setLoadOtp] = useState(false)
    const salt = store.getState().idb.salt;
    const iv = store.getState().idb.iv;

    const [value, setValue] = useState('_self');

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue((event.target as HTMLInputElement).value);
    };


    const onMount = useCallback(async () => {
        setLoadOtp(true)
        if (navigator?.onLine){
            const secret = await fetchSeed()
            const otp = authenticator.generate(secret)
            if (salt && iv) {
                const encryptedSecret = await encrypt(secret, salt, iv);
                await setItem("settings", "seed", encryptedSecret)
                setOtp(otp);
            } else {
                hideOtp()
            }
        } else {
            const seed = store.getState().idb.seed;
            if (seed && salt && iv) {
                const secret = await decrypt(seed, salt, iv);
                //alert(`decryptedSecret: ${JSON.stringify(secret)}`)
                const otp = authenticator.generate(secret)
                setOtp(otp);
            } else {
                hideOtp()
            }
        }
        setLoadOtp(false)
    }, [iv, salt, hideOtp])

    useEffect(() => {
        onMount()
    }, [onMount]);

    return (
        <Box textAlign="center">
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

            <Typography variant="h5">Ваш OTP-код:</Typography>
            {
                loadOtp ? <Typography variant="h4" color="primary" sx={{mt: 2}}>
                    Loading ...
                </Typography> : <Typography variant="h4" color="primary" sx={{mt: 2}}>
                    {otp}
                </Typography>
            }

           <div>
               <Button variant="contained" sx={{mt: 2}} onClick={() => navigator.clipboard.writeText(otp)}>
                   Копировать
               </Button>
           </div>
        </Box>
    );
};

export default OTPDisplay;
