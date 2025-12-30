package com.example.campusvault.data.models;

import com.google.gson.annotations.SerializedName;

/**
 * Request body for changing password
 */
public class PasswordChangeRequest {
    
    @SerializedName("old_password")
    private String oldPassword;
    
    @SerializedName("new_password")
    private String newPassword;

    public PasswordChangeRequest(String oldPassword, String newPassword) {
        this.oldPassword = oldPassword;
        this.newPassword = newPassword;
    }

    public String getOldPassword() {
        return oldPassword;
    }

    public void setOldPassword(String oldPassword) {
        this.oldPassword = oldPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
