import { ReactNode } from "react";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";

export function UIProvider(props: { children: ReactNode }): JSX.Element {
    return (
        <MantineProvider
            inherit
            theme={{ colorScheme: "dark" }}
            withCSSVariables
            withGlobalStyles
            withNormalizeCSS
        >
            <ModalsProvider>{props.children}</ModalsProvider>
        </MantineProvider>
    );
}
