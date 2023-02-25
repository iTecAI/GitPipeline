import { createContext, ReactNode, useContext, useState } from "react";

type Login = {
    loggedIn: false;
} | {
    loggedIn: true;
}

const LoginContext = createContext<Login>({loggedIn: false});

export function LoginProvider(props: {children: ReactNode}) {
    const [login, setLogin] = useState<Login>({loggedIn: false});

    return <LoginContext.Provider value={login}>
        {props.children}
    </LoginContext.Provider>
}

export function useLogin() {
    return useContext(LoginContext);
}