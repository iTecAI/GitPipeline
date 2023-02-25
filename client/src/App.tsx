import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LandingPage } from "./environments/landing/LandingPage";
import { LayoutEnv } from "./environments/layout/Layout";
import { LoginProvider } from "./utils/providers/LoginState";
import { UIProvider } from "./utils/providers/UIProvider";

function RouteContainer() {
    return (
        <BrowserRouter>
            <LoginProvider>
                <UIProvider>
                    <Routes>
                        <Route path="/" element={<LayoutEnv />}>
                            <Route path="login" element={<LandingPage />} />
                        </Route>
                    </Routes>
                </UIProvider>
            </LoginProvider>
        </BrowserRouter>
    );
}

function App() {
    return <RouteContainer />;
}

export default App;
