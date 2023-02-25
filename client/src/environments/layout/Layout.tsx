import { AppShell, Avatar, Header, Title } from "@mantine/core";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useNavigate } from "react-router-dom";
import Logo from "../../assets/logo512.png";
import { useLogin } from "../../utils/providers/LoginState";
import "./layout.scss";

export function LayoutEnv() {
    const { t } = useTranslation();
    const nav = useNavigate();
    const login = useLogin();

    useEffect(() => {
        if (!login.loggedIn) {
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
                </Header>
            }
        >
            <Outlet />
        </AppShell>
    );
}
