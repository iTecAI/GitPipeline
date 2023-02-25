import { AppShell, Avatar, Button, Header, Title } from "@mantine/core";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MdLogout } from "react-icons/md";
import { Outlet, useNavigate } from "react-router-dom";
import Logo from "../../assets/logo512.png";
import { del } from "../../utils/api";
import { useLogin } from "../../utils/providers/LoginState";
import "./layout.scss";

export function LayoutEnv() {
    const { t } = useTranslation();
    const nav = useNavigate();
    const [login, auth] = useLogin();

    useEffect(() => {
        if (!login.loggedIn && !window.localStorage.getItem("token")) {
            nav("/login");
        }
    }, [login]);

    return (
        <AppShell
            padding={"md"}
            header={
                <Header height={48} p="xs" className="app-header">
                    <Avatar size="lg" src={Logo} className="logo" />
                    <Title order={3} className="app-name">
                        {t("app")}
                    </Title>
                    {
                        login.loggedIn && <Button variant="light" leftIcon={<MdLogout />} className="logout-btn" onClick={() => del<null>("/users").then((result) => {
                            if (result.success) {
                                auth();
                            }
                        })}>{t("layout.logout")}</Button>
                    }
                </Header>
            }
        >
            <Outlet />
        </AppShell>
    );
}
