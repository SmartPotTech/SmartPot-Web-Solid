import {render} from "solid-js/web";
import {AppRouter} from "./app/router";
import {AuthProvider} from "./features/auth/AuthProvider";
import {registerServiceWorker} from "./features/pwa/pwa";
import "./styles/index.css";

registerServiceWorker();

render(
    () => (
        <AuthProvider>
            <AppRouter/>
        </AuthProvider>
    ),
    document.getElementById("root")!,
);
