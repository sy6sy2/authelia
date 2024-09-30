import React, { useEffect, useState } from "react";

import { Dialog, DialogContent, DialogTitle, FormControl, Grid2, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";

import { UserInfo } from "@models/UserInfo";

interface UserEditDialogProps {
    user: UserInfo | null;
    open: boolean;
    onClose: () => void;
    onSave: (updatedUser: UserInfo) => void;
}

const EditUserDialog: React.FC<UserEditDialogProps> = ({ user, open, onClose, onSave }) => {
    const { t: translate } = useTranslation("managment");
    const [editedUser, setEditedUser] = useState<UserInfo | null>(null);

    useEffect(() => {
        setEditedUser(user);
    }, [user]);

    if (!editedUser) {
        return null;
    }

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = event.target;
        setEditedUser((prev) => ({
            ...prev!,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSave = () => {
        onSave(editedUser);
    };

    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle>
            {translate("Edit {{item}}: {{user}}", { item: translate("User"), user: editedUser.username })}
        </DialogTitle>
        <DialogContent>
            <FormControl>
                <Grid2 container spacing={1} alignItems={"center"}>
                    <Grid2 size={{ xs: 12 }} sx={{ pt: 3 }}>
                        <TextField />
                    </Grid2>
                </Grid2>
            </FormControl>
        </DialogContent>
    </Dialog>;

    return <div>EditUserDialog</div>;
};

export default EditUserDialog;
