import { useRemoteCall } from "@hooks/RemoteCall";
import { getAllUserInfo } from "@services/UserManagement";

export function useAllUserInfoGET() {
    return useRemoteCall(getAllUserInfo, []);
}
