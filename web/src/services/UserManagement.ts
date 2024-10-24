import { UserInfo } from "@models/UserInfo";
import { AdminConfigPath, AdminManageUserPath, AdminUserInfoPath } from "@services/Api";
import { Get, GetWithOptionalData, PostWithOptionalResponse } from "@services/Client";
import { UserInfoPayload, toSecondFactorMethod } from "@services/UserInfo";

export async function getAllUserInfo(): Promise<UserInfo[]> {
    const res = await Get<UserInfoPayload[]>(AdminUserInfoPath);
    return res.map((user) => ({ ...user, method: toSecondFactorMethod(user.method) }));
}

interface UserChangeBody {
    username: string;
    display_name: string;
    email: string;
    groups: string[];
}

export interface AdminConfig {
    enabled: boolean;
    admin_group: string;
    allow_admins_to_add_admins: boolean;
}

export async function postChangeUser(username: string, display_name: string, email: string, groups: string[]) {
    const data: UserChangeBody = {
        username,
        display_name,
        email,
        groups,
    };
    console.log(data);
    return PostWithOptionalResponse(AdminManageUserPath, data);
}

export async function getAdminConfiguration(): Promise<AdminConfig> {
    const res = await Get<AdminConfig>(AdminConfigPath);
    return res;
}
