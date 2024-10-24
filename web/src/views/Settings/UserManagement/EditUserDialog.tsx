import React, { useEffect, useState } from "react";

import { Autocomplete, Button, Dialog, DialogContent, DialogTitle, FormControl, Grid2, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useNotifications } from "@hooks/NotificationsContext";
import { UserInfo } from "@models/UserInfo";
import { postChangeUser } from "@services/UserManagement";
import VerifyExitDialog from "@views/Settings/Common/VerifyExitDialog";

interface Props {
    user: UserInfo | null;
    open: boolean;
    onClose: () => void;
}

const EditUserDialog: React.FC<Props> = ({ user, open, onClose }) => {
    const { t: translate } = useTranslation("settings");
    const { createSuccessNotification, createErrorNotification } = useNotifications();

    const [editedUser, setEditedUser] = useState<UserInfo | null>(null);
    const [changesMade, setChangesMade] = useState(false);
    const [verifyExitDialogOpen, setVerifyExitDialogOpen] = useState(false);
    const [displayNameError, setDisplayNameError] = useState(false);
    const [emailError, setEmailError] = useState(false);
    useEffect(() => {
        setEditedUser(user);
        setChangesMade(false);
    }, [user]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = event.target;
        setEditedUser((prev) => {
            if (!prev) return null;
            const editedUser = {
                ...prev,
                [name]: type === "checkbox" ? checked : value,
            };
            setChangesMade(JSON.stringify(editedUser) !== JSON.stringify(user));
            return editedUser;
        });
    };

    const handleGroupsChange = (_event: React.SyntheticEvent, value: string[]) => {
        setEditedUser((prev) => {
            if (!prev) return null;
            const updatedUser = { ...prev, groups: value };
            setChangesMade(JSON.stringify(updatedUser) !== JSON.stringify(user));
            return updatedUser;
        });
    };

    const handleSave = async () => {
        if (!changesMade) {
            return;
        }
        if (editedUser != null) {
            console.log("Saving updated user:", editedUser);
            if (editedUser.display_name.trim() === "" || editedUser.emails[0] === "") {
                if (editedUser.display_name.trim() === "") {
                    setDisplayNameError(true);
                }
                if (editedUser.display_name.trim() === "") {
                    setEmailError(true);
                }
                return;
            }
            try {
                console.log(editedUser.emails);
                await postChangeUser(
                    editedUser.username,
                    editedUser.display_name,
                    Array.isArray(editedUser.emails) ? editedUser.emails[0] : editedUser.emails,
                    editedUser.groups,
                );
                createSuccessNotification(translate("User modified successfully."));
                onClose();
            } catch (err) {
                handleResetErrors();
                if ((err as Error).message.includes("")) {
                    createErrorNotification(translate("An error!"));
                }
            }
            onClose();
        } else {
            return;
        }
    };

    const handleResetErrors = () => {
        setDisplayNameError(false);
        setEmailError(false);
    };

    const handleClose = () => {
        if (changesMade) {
            setVerifyExitDialogOpen(true);
        } else {
            onClose();
        }
    };

    const handleConfirmExit = () => {
        setVerifyExitDialogOpen(false);
        setEditedUser(user);
        setChangesMade(false);
        onClose();
    };

    const handleCancelExit = () => {
        setVerifyExitDialogOpen(false);
    };
    console.log(user);
    return (
        <div>
            <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
                <DialogTitle>
                    {translate("Edit {{item}}:", { item: translate("User") })} {user?.username}
                </DialogTitle>
                <DialogContent>
                    <FormControl>
                        <Grid2 container spacing={1} alignItems={"center"}>
                            <Grid2 size={{ xs: 12 }} sx={{ pt: 3 }}>
                                <TextField
                                    fullWidth
                                    label="Display Name"
                                    name="display_name"
                                    error={displayNameError}
                                    value={editedUser?.display_name ?? ""}
                                    onChange={handleChange}
                                />
                            </Grid2>
                            <Grid2 size={{ xs: 12 }} sx={{ pt: 3 }}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="emails"
                                    error={emailError}
                                    value={
                                        Array.isArray(editedUser?.emails)
                                            ? editedUser.emails[0]
                                            : (editedUser?.emails ?? "")
                                    }
                                    onChange={handleChange}
                                />
                            </Grid2>
                            <Grid2 size={{ xs: 12 }} sx={{ pt: 3 }}>
                                <Autocomplete
                                    multiple
                                    id="select-user-groups"
                                    options={[]}
                                    value={editedUser?.groups || []}
                                    onChange={handleGroupsChange}
                                    freeSolo
                                    renderInput={(params) => <TextField {...params} label="Groups" placeholder="" />}
                                />
                            </Grid2>
                            <Grid2 size={{ xs: 12 }} sx={{ pt: 3 }}>
                                <Button color={"success"} onClick={handleSave} disabled={!changesMade}>
                                    Save
                                </Button>
                                <Button color={"error"} onClick={handleClose}>
                                    Exit
                                </Button>
                            </Grid2>
                        </Grid2>
                    </FormControl>
                </DialogContent>
            </Dialog>
            <VerifyExitDialog open={verifyExitDialogOpen} onConfirm={handleConfirmExit} onCancel={handleCancelExit} />
        </div>
    );
};

export default EditUserDialog;
