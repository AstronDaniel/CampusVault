package com.example.campusvault.data.models;

import com.google.gson.annotations.SerializedName;

/**
 * Request body for linking an existing resource to a different course unit.
 * This avoids re-uploading duplicate files.
 */
public class LinkResourceRequest {
    
    @SerializedName("course_unit_id")
    private int courseUnitId;
    
    @SerializedName("title")
    private String title;
    
    @SerializedName("description")
    private String description;

    public LinkResourceRequest(int courseUnitId, String title, String description) {
        this.courseUnitId = courseUnitId;
        this.title = title;
        this.description = description;
    }

    public int getCourseUnitId() {
        return courseUnitId;
    }

    public void setCourseUnitId(int courseUnitId) {
        this.courseUnitId = courseUnitId;
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
}
