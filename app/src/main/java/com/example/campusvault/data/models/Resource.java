package com.example.campusvault.data.models;

import androidx.room.Embedded;
import androidx.room.Entity;
import androidx.room.PrimaryKey;
import androidx.room.TypeConverters;
import com.example.campusvault.data.local.converters.Converters;
import com.google.gson.annotations.SerializedName;
import java.util.Date;
import java.util.List;

@Entity(tableName = "resources")
@TypeConverters(Converters.class)
public class Resource {

    @PrimaryKey
    @SerializedName("id")
    private int id;

    @SerializedName("title")
    private String title;

    @SerializedName("description")
    private String description;

    @SerializedName("url")
    private String fileUrl;

    @SerializedName("thumbnail_url")
    private String thumbnailUrl;

    @SerializedName("file_type")
    private String fileType;

    @SerializedName("size_bytes")
    private long fileSize;

    @Embedded(prefix = "author_")
    @SerializedName("author")
    private Author author;

    @Embedded(prefix = "course_unit_")
    @SerializedName("course_unit")
    private CourseUnitInfo courseUnit;

    // Direct course_unit_id from API (when course_unit object is not nested)
    @SerializedName("course_unit_id")
    private Integer courseUnitId;

    @SerializedName("tags")
    private List<String> tags;

    @SerializedName("download_count")
    private int downloadCount;

    @SerializedName("average_rating")
    private float averageRating;

    @SerializedName("is_bookmarked")
    private boolean isBookmarked;

    @SerializedName("user_rating")
    private Integer userRating;

    @SerializedName("created_at")
    private Date uploadedAt;

    @SerializedName("resource_type")
    private String resourceType;

    @SerializedName("filename")
    private String filename;

    // Getters and Setters
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
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

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public long getFileSize() {
        return fileSize;
    }

    public void setFileSize(long fileSize) {
        this.fileSize = fileSize;
    }

    public Author getAuthor() {
        return author;
    }

    public void setAuthor(Author author) {
        this.author = author;
    }

    public CourseUnitInfo getCourseUnit() {
        return courseUnit;
    }

    public void setCourseUnit(CourseUnitInfo courseUnit) {
        this.courseUnit = courseUnit;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public int getDownloadCount() {
        return downloadCount;
    }

    public void setDownloadCount(int downloadCount) {
        this.downloadCount = downloadCount;
    }

    public float getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(float averageRating) {
        this.averageRating = averageRating;
    }

    public boolean isBookmarked() {
        return isBookmarked;
    }

    public void setBookmarked(boolean bookmarked) {
        isBookmarked = bookmarked;
    }

    public Integer getUserRating() {
        return userRating;
    }

    public void setUserRating(Integer userRating) {
        this.userRating = userRating;
    }

    public Date getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(Date uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public Integer getCourseUnitId() {
        return courseUnitId;
    }

    public void setCourseUnitId(Integer courseUnitId) {
        this.courseUnitId = courseUnitId;
    }

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }
}
