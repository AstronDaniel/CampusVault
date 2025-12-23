package com.example.campusvault.data.models;

import com.google.gson.annotations.SerializedName;

/**
 * Request body for the mobile upload endpoint.
 * Uses base64-encoded file content instead of multipart to avoid WAF issues.
 */
public class MobileUploadRequest {
    
    @SerializedName("course_unit_id")
    private int courseUnitId;
    
    @SerializedName("filename")
    private String filename;
    
    @SerializedName("content_type")
    private String contentType;
    
    @SerializedName("file_base64")
    private String fileBase64;
    
    @SerializedName("title")
    private String title;
    
    @SerializedName("description")
    private String description;
    
    @SerializedName("resource_type")
    private String resourceType;

    public MobileUploadRequest() {
        this.resourceType = "notes"; // Default
    }

    public MobileUploadRequest(int courseUnitId, String filename, String contentType, 
                               String fileBase64, String title, String description, String resourceType) {
        this.courseUnitId = courseUnitId;
        this.filename = filename;
        this.contentType = contentType;
        this.fileBase64 = fileBase64;
        this.title = title;
        this.description = description;
        this.resourceType = resourceType != null ? resourceType : "notes";
    }

    // Getters and Setters
    public int getCourseUnitId() {
        return courseUnitId;
    }

    public void setCourseUnitId(int courseUnitId) {
        this.courseUnitId = courseUnitId;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public String getFileBase64() {
        return fileBase64;
    }

    public void setFileBase64(String fileBase64) {
        this.fileBase64 = fileBase64;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }
}
