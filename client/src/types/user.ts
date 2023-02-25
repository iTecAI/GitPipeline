export type LoginResponse = {
    user: string;
    session: string;
}

export type OAuthResult = {
    user_id: string;
    session_id: string;
    action: "create_account" | "login" | "add_account"
};