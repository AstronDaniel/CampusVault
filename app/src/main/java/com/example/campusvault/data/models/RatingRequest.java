package com.example.campusvault.data.models;

import com.google.gson.annotations.SerializedName;

public class RatingRequest {
    @SerializedName("rating")
    private int rating;
    
    public RatingRequest(int rating) {
        this.rating = rating;
    }
    
    public int getRating() {
        return rating;
    }
    
    public void setRating(int rating) {
        this.rating = rating;
    }
}
