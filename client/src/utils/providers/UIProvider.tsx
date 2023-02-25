import { ReactNode } from "react";
import {MantineProvider} from "@mantine/core";

export function UIProvider(props: {children: ReactNode}): JSX.Element {
    return (
        <MantineProvider
            inherit
            theme={{ colorScheme: "dark" }}
            withCSSVariables
            withGlobalStyles
            withNormalizeCSS
        >
            {props.children}
        </MantineProvider>
    );
}