import { Redirect } from "expo-router";

// Catch-all route to handle OAuth callback and other unmatched routes
// This redirects back to the main index which handles the auth flow
export default function CatchAll() {
    return <Redirect href="/" />;
}
