import { ReactNode } from "react";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import {NotificationsProvider} from "@mantine/notifications";

export function UIProvider(props: { children: ReactNode }): JSX.Element {
    return (
        <MantineProvider
            inherit
            theme={{ colorScheme: "dark" }}
            withCSSVariables
            withGlobalStyles
            withNormalizeCSS
        >
            <NotificationsProvider autoClose={6000}>
                <ModalsProvider>{props.children}</ModalsProvider>
            </NotificationsProvider>
        </MantineProvider>
    );
}
