import { AppShell, Avatar, Header, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router-dom";
import Logo from "../../assets/logo512.png";
import "./layout.scss";

export function LayoutEnv() {
    const {t} = useTranslation();
    return (
        <AppShell
            padding={"md"}
            header={
                <Header height={48} p="xs" className="app-header">
                    <Avatar size="lg" src={Logo} className="logo" />
                    <Title order={3} className="app-name">{t("app")}</Title>
                </Header>
            }
        >
            <Outlet />
        </AppShell>
    );
}
