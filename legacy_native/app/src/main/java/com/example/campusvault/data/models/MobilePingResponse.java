package com.example.campusvault.data.models;

import com.google.gson.annotations.SerializedName;

/**
 * Response from the mobile ping endpoint to verify authentication
 */
public class MobilePingResponse {
    
    @SerializedName("status")
    private String status;
    
    @SerializedName("user_id")
    private int userId;
    
    @SerializedName("username")
    private String username;
    
    @SerializedName("message")
    private String message;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getUserId() {
        return userId;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isOk() {
        return "ok".equals(status);
    }
}
