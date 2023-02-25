import { Session } from "inspector";
import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { GithubAccount } from "../../types/githubAccounts";
import { get } from "../api";

type Login =
    | {
          loggedIn: false;
      }
    | {
          loggedIn: true;
          sessionId: string;
          userId: string;
          username: string;
          accounts: GithubAccount[];
          avatar: string | null;
          type: "manual" | "github";
      };

const LoginContext = createContext<
    [Login, (session?: string, user?: string) => void]
>([{ loggedIn: false }, (session, user) => {}]);

export function LoginProvider(props: { children: ReactNode }) {
    const [login, setLogin] = useState<Login>({ loggedIn: false });
    const location = useLocation();

    useMemo(() => {
        if (localStorage.getItem("token") && localStorage.getItem("user")) {
            get<{ username: string; accounts: GithubAccount[], avatar?: string; type: "manual" | "github" }>("/users").then(
                (result) => {
                    if (result.success) {
                        setLogin({
                            loggedIn: true,
                            sessionId: localStorage.getItem("token") as string,
                            userId: localStorage.getItem("user") as string,
                            username: result.data.username,
                            accounts: result.data.accounts,
                            avatar: result.data.avatar ?? null,
                            type: result.data.type
                        });
                    } else {
                        localStorage.removeItem("token");
                        localStorage.removeItem("user");
                    }
                }
            );
        }
    }, [location]);

    return (
        <LoginContext.Provider
            value={[
                login,
                (session?: string, user?: string) => {
                    if (!session || !user) {
                        localStorage.removeItem("token");
                        localStorage.removeItem("user");
                        setLogin({ loggedIn: false });
                        return;
                    }
                    localStorage.setItem("token", session);
                    localStorage.setItem("user", user);
                    get<{
                        username: string;
                        accounts: GithubAccount[];
                        avatar?: string;
                        type: "manual" | "github";
                    }>("/users").then((result) => {
                        if (result.success) {
                            setLogin({
                                loggedIn: true,
                                sessionId: localStorage.getItem(
                                    "token"
                                ) as string,
                                userId: localStorage.getItem("user") as string,
                                username: result.data.username,
                                accounts: result.data.accounts,
                                avatar: result.data.avatar ?? null,
                                type: result.data.type,
                            });
                        } else {
                            localStorage.removeItem("token");
                            localStorage.removeItem("user");
                        }
                    });
                },
            ]}
        >
            {props.children}
        </LoginContext.Provider>
    );
}

export function useLogin() {
    return useContext(LoginContext);
}
