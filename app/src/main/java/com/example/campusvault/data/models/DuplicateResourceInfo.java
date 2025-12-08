package com.example.campusvault.data.models;

import com.google.gson.annotations.SerializedName;

/**
 * Represents the existing resource info returned when a 409 Conflict occurs during upload.
 * This is used to offer the user the option to link the existing resource instead of re-uploading.
 */
public class DuplicateResourceInfo {
    
    @SerializedName("id")
    private int id;
    
    @SerializedName("course_unit_id")
    private int courseUnitId;
    
    @SerializedName("uploader_id")
    private int uploaderId;
    
    @SerializedName("title")
    private String title;
    
    @SerializedName("description")
    private String description;
    
    @SerializedName("filename")
    private String filename;
    
    @SerializedName("content_type")
    private String contentType;
    
    @SerializedName("size_bytes")
    private long sizeBytes;
    
    @SerializedName("sha256")
    private String sha256;
    
    @SerializedName("storage_path")
    private String storagePath;
    
    @SerializedName("url")
    private String url;
    
    @SerializedName("created_at")
    private String createdAt;

    // Getters
    public int getId() { return id; }
    public int getCourseUnitId() { return courseUnitId; }
    public int getUploaderId() { return uploaderId; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getFilename() { return filename; }
    public String getContentType() { return contentType; }
    public long getSizeBytes() { return sizeBytes; }
    public String getSha256() { return sha256; }
    public String getStoragePath() { return storagePath; }
    public String getUrl() { return url; }
    public String getCreatedAt() { return createdAt; }
}
