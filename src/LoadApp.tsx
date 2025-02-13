import {useDispatch} from "react-redux";
import {useCallback, useEffect, useState} from "react";
import {initDB} from "./store/idb.ts";
import {setDB, setRawId, setSeed} from "./store/idbSlice.ts";
import {Typography} from "@mui/material";

const LoadApp = ({children}: { children: React.ReactNode }) => {
    const dispatch = useDispatch();
    const [loadApp, setLoadApp] = useState(true)
    const initApp = useCallback(async () => {
        const db = await initDB();
        dispatch(setDB(db))
        const rawId = await db.get("settings","rawId")
        if (rawId) {
            dispatch(setRawId(rawId as number[]))
        }
        const seed = await db.get("settings","seed")
        if (seed) {
            dispatch(setSeed(seed as ArrayBuffer))
        }
        setLoadApp(false);
    },[dispatch])

    useEffect(() => {
        initApp()
    }, [initApp]);

    return <>
        {loadApp ? <Typography variant="h5">
                Load app ...
            </Typography>
            : children
        }
    </>;
};

export default LoadApp;