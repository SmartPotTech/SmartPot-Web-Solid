import {Route, Router} from "@solidjs/router";
import {AppShell} from "../components/layout/AppShell";
import {PublicLayout} from "../components/layout/PublicLayout";
import {LoginPage} from "../features/auth/LoginPage";
import {ForgotPasswordPage, ResetPasswordPage} from "../features/auth/PasswordRecoveryPages";
import {RegisterPage} from "../features/auth/RegisterPage";
import {RedirectIfAuthenticated, RequireAuth} from "../features/auth/RequireAuth";
import {ActionsPage} from "../features/actions/ActionsPage";
import {ControlPage} from "../features/control/ControlPage";
import {CropsPage} from "../features/crops/CropsPage";
import {LandingPage} from "../features/landing/LandingPage";
import {LearningPage} from "../features/learning/LearningPage";
import {NotificationsPage} from "../features/notifications/NotificationsPage";
import {ProfilePage} from "../features/profile/ProfilePage";
import {LazyCropDetailPage} from "./LazyCropDetailPage";
import {LazyOverviewPage} from "./LazyOverviewPage";
import {NotFoundPage} from "./NotFoundPage";

export function AppRouter() {
    return (
        <Router>
            <Route path="/app" component={(props) => <RequireAuth><AppShell>{props.children}</AppShell></RequireAuth>}>
                <Route path="/" component={LazyOverviewPage}/>
                <Route path="/crops" component={CropsPage}/>
                <Route path="/crops/:cropId" component={LazyCropDetailPage}/>
                <Route path="/control" component={ControlPage}/>
                <Route path="/actions" component={ActionsPage}/>
                <Route path="/learning" component={LearningPage}/>
                <Route path="/notifications" component={NotificationsPage}/>
                <Route path="/profile" component={ProfilePage}/>
            </Route>
            <Route path="/" component={PublicLayout}>
                <Route path="/" component={LandingPage}/>
                <Route path="/login" component={() => <RedirectIfAuthenticated><LoginPage/></RedirectIfAuthenticated>}/>
                <Route path="/register" component={() => <RedirectIfAuthenticated><RegisterPage/></RedirectIfAuthenticated>}/>
                <Route path="/forgot-password" component={ForgotPasswordPage}/>
                <Route path="/reset-password" component={ResetPasswordPage}/>
                <Route path="*" component={NotFoundPage}/>
            </Route>
        </Router>
    );
}
