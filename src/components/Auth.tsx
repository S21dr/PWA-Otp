import {useState, useEffect, FunctionComponent} from "react";
import PinAuth from "./PinAuth.tsx";
import {openDB} from "idb";
import BiometricAuth from "./BiometricAuth.tsx";
interface OwnProps {
    handleChangeAuth: (auth:boolean) => void
}

type Props = OwnProps;
const AuthComponent: FunctionComponent<Props> = ({handleChangeAuth}) => {
    const [loadPage, setLoadPage] = useState(true)
    const [isPinSet, setIsPinSet] = useState(false);

    const handleChangeIsPinSet = (arg: boolean) => {
        setIsPinSet(arg)
    }

    const onMount = async () => {
        const database = await openDB("DB", 1, {
            upgrade(db) {
                db.createObjectStore("pins", {keyPath: "id"});
                db.createObjectStore("biometricAuth", {keyPath: "id"});
            },
        });
        const tx = database.transaction("pins", "readonly");
        const store = tx.objectStore("pins");
        const storedPinData = await store.get("userPin");
        if (storedPinData) {
            setIsPinSet(true)
        }
    }

    useEffect(() => {
        onMount().then(() => setLoadPage(false))
    }, []);


    return (<>
        {
            loadPage ? <h4>Loading ...</h4>
                : <div>
                    <h4>Аутентификация</h4>
                    <PinAuth isPinSet={isPinSet} setIsPinSet={handleChangeIsPinSet} handleChangeAuth={handleChangeAuth}/>
                    {isPinSet && <BiometricAuth handleChangeAuth={handleChangeAuth}/>}

                </div>
        }

    </>);
};

export default AuthComponent;