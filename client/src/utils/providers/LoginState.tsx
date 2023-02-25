import { Session } from "inspector";
import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { get } from "../api";

type Login = {
    loggedIn: false;
} | {
    loggedIn: true;
    sessionId: string;
    userId: string;
}

const LoginContext = createContext<[Login, (session?: string, user?: string) => void]>([{loggedIn: false}, (session, user) => {}]);

export function LoginProvider(props: {children: ReactNode}) {
    const [login, setLogin] = useState<Login>({loggedIn: false});
    const location = useLocation();

    useMemo(() => {
        if (localStorage.getItem("token") && localStorage.getItem("user")) {
            get<{email: string}>("/users").then((result) => {
                if (result.success) {
                    console.log(result);
                    setLogin({
                        loggedIn: true,
                        sessionId: localStorage.getItem("token") as string,
                        userId: localStorage.getItem("user") as string,
                    });
                }
            })
        }
    }, [location]);

    return <LoginContext.Provider value={[login, (session?: string, user?: string) => {
        if (!session || !user) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setLogin({loggedIn: false});
            return;
        }
        localStorage.setItem("token", session);
        localStorage.setItem("user", user);
        setLogin({
            loggedIn: true,
            sessionId: session,
            userId: user
        });
    }]}>
        {props.children}
    </LoginContext.Provider>
}

export function useLogin() {
    return useContext(LoginContext);
}