import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LayoutEnv } from "./environments/layout/Layout";
import { UIProvider } from "./utils/providers/UIProvider";

function RouteContainer() {
    return <BrowserRouter>
        <Routes>
            <Route path="/" element={<LayoutEnv />}></Route>
        </Routes>
    </BrowserRouter>
}

function App() {
    return <UIProvider><RouteContainer /></UIProvider>;
}

export default App;
