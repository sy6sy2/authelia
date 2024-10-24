import { SecondFactorMethod } from "@models/Methods";

export interface UserInfo {
    username: string;
    display_name: string;
    emails: string[];
    groups: string[];
    disabled?: boolean;
    last_logged_in?: Date;
    password_change_required?: boolean;
    last_password_change?: Date;
    logout_required?: boolean;
    user_created_at?: Date;
    method: SecondFactorMethod;
    has_webauthn: boolean;
    has_totp: boolean;
    has_duo: boolean;
}
