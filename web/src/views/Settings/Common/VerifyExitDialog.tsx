import React from "react";

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

interface VerifyExitDialogProps {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const VerifyExitDialog: React.FC<VerifyExitDialogProps> = ({ open, onConfirm, onCancel }) => {
    return (
        <Dialog open={open} onClose={onCancel}>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    You have unsaved changes. Are you sure you want to exit without saving?
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>Cancel</Button>
                <Button onClick={onConfirm} color="error">
                    Exit Without Saving
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default VerifyExitDialog;
