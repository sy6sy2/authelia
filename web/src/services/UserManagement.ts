import { UserInfo } from "@models/UserInfo";
import { AdminUserInfoPath } from "@services/Api";
import { Get } from "@services/Client";
import { UserInfoPayload, toSecondFactorMethod } from "@services/UserInfo";

export async function getAllUserInfo(): Promise<UserInfo[]> {
    const res = await Get<UserInfoPayload[]>(AdminUserInfoPath);
    return res.map((user) => ({ ...user, method: toSecondFactorMethod(user.method) }));
}
