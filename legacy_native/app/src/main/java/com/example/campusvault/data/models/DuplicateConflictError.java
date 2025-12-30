package com.example.campusvault.data.models;

import com.google.gson.annotations.SerializedName;

/**
 * Error response for 409 Conflict when duplicate content is detected during upload.
 */
public class DuplicateConflictError {
    
    @SerializedName("message")
    private String message;
    
    @SerializedName("resource")
    private DuplicateResourceInfo resource;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public DuplicateResourceInfo getResource() {
        return resource;
    }

    public void setResource(DuplicateResourceInfo resource) {
        this.resource = resource;
    }
}
