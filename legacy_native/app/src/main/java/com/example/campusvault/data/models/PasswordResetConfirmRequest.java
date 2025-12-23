package com.example.campusvault.data.models;

import com.google.gson.annotations.SerializedName;

/**
 * Request model for confirming password reset (if handled in-app)
 */
public class PasswordResetConfirmRequest {
    @SerializedName("token")
    private String token;

    @SerializedName("new_password")
    private String newPassword;

    public PasswordResetConfirmRequest(String token, String newPassword) {
        this.token = token;
        this.newPassword = newPassword;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
