package com.example.campusvault.data.models;

import com.google.gson.annotations.SerializedName;

/**
 * Response from the duplicate check endpoint.
 * Indicates if a file already exists in the database.
 */
public class DuplicateCheckResponse {
    
    @SerializedName("duplicate")
    private boolean duplicate;
    
    @SerializedName("existing")
    private Resource existing;

    public boolean isDuplicate() {
        return duplicate;
    }

    public void setDuplicate(boolean duplicate) {
        this.duplicate = duplicate;
    }

    public Resource getExisting() {
        return existing;
    }

    public void setExisting(Resource existing) {
        this.existing = existing;
    }
}
