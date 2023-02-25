import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OAuthResult } from "../../types/user";
import { get } from "../../utils/api";
import { useLogin } from "../../utils/providers/LoginState";

export function AuthTarget() {
    const [login, auth] = useLogin();
    const nav = useNavigate();
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        get<OAuthResult>(
            `/gh/flow/2${
                params.get("state") && params.get("state")?.endsWith("-login")
                    ? "/login"
                    : ""
            }`,
            {
                query: {
                    state_key: params.get("state"),
                    code: params.get("code"),
                },
            }
        ).then((result) => {
            if (result.success) {
                auth(result.data.session_id, result.data.user_id);
                nav("/");
            }
        });
    }, []);
    return <></>;
}
