package com.example.campusvault.data.models;

import com.google.gson.annotations.SerializedName;

public class UserStats {
    @SerializedName("total_uploads")
    public int totalUploads;
    
    @SerializedName("total_downloads")
    public int totalDownloads;
    
    @SerializedName("total_bookmarks")
    public int totalBookmarks;
    
    @SerializedName("bookmarks_count")
    public int bookmarksCount;
    
    @SerializedName("average_rating")
    public float averageRating;
    
    @SerializedName("contribution_score")
    public int contributionScore;
}
