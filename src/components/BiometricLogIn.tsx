import {Box, Button, Typography} from "@mui/material";
import {FC} from "react";
import {RootState, store} from "../store";
import {saveLargeBlob, tryBiometricLogin} from "../utils/helpers.ts";
import {setIv, setSalt} from "../store/idbSlice.ts";
import {useDispatch} from "react-redux";

const BiometricLogIn: FC<{ onComplete: () => void }> = ({onComplete}) => {

    const dispatch = useDispatch();
    const rawId = store.getState().idb.rawId

    const logInBio = async () => {
        if (rawId){
            if ((store.getState() as RootState).idb.seed) {
                const largeBlob = await tryBiometricLogin(rawId)
                if (largeBlob) {
                    dispatch(setSalt(largeBlob.salt))
                    dispatch(setIv(largeBlob.iv))
                    onComplete()
                }
            } else {
                const largeBlob = await saveLargeBlob(rawId)
                if (largeBlob) {
                    dispatch(setSalt(largeBlob.salt))
                    dispatch(setIv(largeBlob.iv))
                    onComplete()
                }
            }
        }
    };


    return (
        <Box textAlign="center">
            <Typography variant="h5" sx={{mt: 3}}>Выберите сегмент</Typography>
            <div>
                <Button variant="contained" onClick={logInBio}
                        sx={{mt: 2}}>
                    Sigma
                </Button>
            </div>
            <div>
                <Button variant="contained" disabled
                        sx={{mt: 2}}>
                    Omega
                </Button>
            </div>
        </Box>
    );
};

export default BiometricLogIn;
