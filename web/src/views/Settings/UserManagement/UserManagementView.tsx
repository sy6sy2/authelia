import React, { useCallback, useEffect, useMemo, useState } from "react";

//import { useTheme } from "@mui/material";
import { DataGrid, GridColDef, GridRowParams, GridRowsProp } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";

import { useNotifications } from "@hooks/NotificationsContext";
import { useAllUserInfoGET } from "@hooks/UserManagement";
import { UserInfo } from "@models/UserInfo";
import { to2FAString } from "@services/UserInfo";
import EditUserDialog from "@views/Settings/UserManagement/EditUserDialog";

const columns: GridColDef[] = [
    { field: "username", headerName: "Username", resizable: false },
    { field: "display_name", headerName: "Display Name", flex: 1 },
    { field: "emails", headerName: "Email", flex: 1 },
    //{ field: "groups", headerName: "Groups", flex: 1 },
    //{ field: "disabled", headerName: "Disabled" },
    { field: "last_logged_in", headerName: "Last Log In", flex: 1 },
    //{ field: "password_change_required", headerName: "Password Change Required", flex: 1 },
    { field: "last_password_change", headerName: "Last Password Change", flex: 1 },
    //{ field: "logout_required", headerName: "Logout Required", flex: 1 },
    { field: "user_created_at", headerName: "User Created At", flex: 1 },
    { field: "method", headerName: "Default 2FA Method", flex: 1 },
    { field: "has_webauthn", headerName: "WebAuthn?", flex: 1 },
    { field: "has_totp", headerName: "Totp?", flex: 1 },
    { field: "has_duo", headerName: "Duo?", flex: 1 },
];

const UserManagementView = () => {
    const { t: translate } = useTranslation("settings");
    const { createErrorNotification } = useNotifications();

    const [userInfo, fetchUserInfo, , fetchUserInfoError] = useAllUserInfoGET();
    const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);

    const handleRowClick = (params: GridRowParams) => {
        if (!userInfo) {
            createErrorNotification(translate("Unable to edit user."));
            return;
        }
        const user = userInfo.find((u: UserInfo) => u.username === params.row.username);
        if (user) {
            setSelectedUser(user);
            handleOpenUserDialog();
        }
    };

    const handleResetState = useCallback(() => {
        setIsUserDialogOpen(false);
    }, []);

    const handleOpenUserDialog = useCallback(() => {
        handleResetState();
        setIsUserDialogOpen(true);
    }, [handleResetState, setIsUserDialogOpen]);

    const handleCloseUserDialog = useCallback(() => {
        setIsUserDialogOpen(false);
        handleResetState();
        fetchUserInfo();
    }, [handleResetState, setIsUserDialogOpen, fetchUserInfo]);

    useEffect(() => {
        fetchUserInfo();
    }, [fetchUserInfo]);

    useEffect(() => {
        if (fetchUserInfoError) {
            createErrorNotification(translate("There was an issue retrieving user info"));
        }
    }, [fetchUserInfoError, createErrorNotification, translate]);

    const rows: GridRowsProp = useMemo(() => {
        if (!userInfo) {
            return [];
        }

        if (!Array.isArray(userInfo)) {
            createErrorNotification("Error fetching User Info");
            return [];
        }

        const processedRows = userInfo.map((user: UserInfo, index: number) => {
            const row = {
                id: index,
                username: user.username,
                display_name: user.display_name,
                emails: Array.isArray(user.emails) ? user.emails[0] : user.emails,
                //groups: Array.isArray(user.groups) ? user.groups[0] : user.groups,
                //disabled: user.disabled ? "Yes" : "No",
                last_logged_in: user.last_logged_in ? new Date(user.last_logged_in).toLocaleString() : "-",
                //password_change_required: user.password_change_required ? "Yes" : "No",
                last_password_change: user.last_password_change
                    ? new Date(user.last_password_change).toLocaleString()
                    : "-",
                //logout_required: user.logout_required ? "Yes" : "No",
                user_created_at: user.user_created_at ? new Date(user.user_created_at).toLocaleString() : "-",
                method:
                    user.method && (user.has_duo || user.has_totp || user.has_webauthn)
                        ? to2FAString(user.method)
                        : "-",
                has_webauthn: user.has_webauthn ? "Yes" : "No",
                has_totp: user.has_totp ? "Yes" : "No",
                has_duo: user.has_duo ? "Yes" : "No",
            };
            return row;
        });

        return processedRows;
    }, [userInfo, createErrorNotification]);

    return (
        <>
            <EditUserDialog user={selectedUser} open={isUserDialogOpen} onClose={handleCloseUserDialog} />
            <div style={{ height: 400, width: "100%" }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    onRowDoubleClick={handleRowClick}
                    checkboxSelection
                    autosizeOnMount
                    initialState={{
                        columns: {
                            columnVisibilityModel: {
                                password_change_required: false,
                                logout_required: false,
                                has_totp: false,
                                has_webauthn: false,
                                has_duo: false,
                            },
                        },
                    }}
                />
            </div>
        </>
    );
};

export default UserManagementView;
