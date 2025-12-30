package com.example.campusvault.data.models;

import com.google.gson.annotations.SerializedName;

public class CommentRequest {
    @SerializedName("body")
    private String body;
    
    public CommentRequest(String body) {
        this.body = body;
    }
    
    public String getBody() {
        return body;
    }
    
    public void setBody(String body) {
        this.body = body;
    }
}
