import { useRemoteCall } from "@hooks/RemoteCall";
import { UserInfo } from "@models/UserInfo";
import { getUserInfo } from "@services/UserInfo";
import { AdminConfig, getAdminConfiguration, getAllUserInfo } from "@services/UserManagement";
import { useEffect, useState } from "react";

export function useAllUserInfoGET() {
    return useRemoteCall(getAllUserInfo, []);
}

export const useUserPermissions = () => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<UserInfo | null>(null);
    const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null);

    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                const response = await getUserInfo();
                setUser(response);
            } catch (error) {
            } finally {
                setLoading(false);
            }
        };

        fetchPermissions();
    }, []);

    useEffect(() => {
        const fetchAdminConfig = async () => {
            try {
                const response = await getAdminConfiguration();
                setAdminConfig(response);
            } catch (error) {
                setAdminConfig(null);
            }
        };

        fetchAdminConfig();
    }, []);

    return { adminConfig, loading };
};
