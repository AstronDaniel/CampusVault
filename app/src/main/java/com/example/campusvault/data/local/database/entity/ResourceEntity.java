package com.example.campusvault.data.local.database.entity;

import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.PrimaryKey;
import java.util.Date;
import java.util.List;

/**
 * Room entity for Resource data
 */
@Entity(tableName = "resources")
public class ResourceEntity {

    @PrimaryKey
    @ColumnInfo(name = "id")
    private int id;

    @ColumnInfo(name = "title")
    private String title;

    @ColumnInfo(name = "description")
    private String description;

    @ColumnInfo(name = "file_url")
    private String fileUrl;

    @ColumnInfo(name = "thumbnail_url")
    private String thumbnailUrl;

    @ColumnInfo(name = "file_type")
    private String fileType;

    @ColumnInfo(name = "file_size")
    private long fileSize;

    @ColumnInfo(name = "author_id")
    private int authorId;

    @ColumnInfo(name = "author_name")
    private String authorName;

    @ColumnInfo(name = "course_unit_id")
    private Integer courseUnitId;

    @ColumnInfo(name = "course_unit_name")
    private String courseUnitName;

    @ColumnInfo(name = "tags")
    private List<String> tags;

    @ColumnInfo(name = "download_count")
    private int downloadCount;

    @ColumnInfo(name = "average_rating")
    private float averageRating;

    @ColumnInfo(name = "is_bookmarked")
    private boolean isBookmarked;

    @ColumnInfo(name = "uploaded_at")
    private Date uploadedAt;

    @ColumnInfo(name = "cached_at")
    private Date cachedAt;

    // Constructor
    public ResourceEntity() {
        this.cachedAt = new Date();
    }

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

    public int getAuthorId() {
        return authorId;
    }

    public void setAuthorId(int authorId) {
        this.authorId = authorId;
    }

    public String getAuthorName() {
        return authorName;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }

    public Integer getCourseUnitId() {
        return courseUnitId;
    }

    public void setCourseUnitId(Integer courseUnitId) {
        this.courseUnitId = courseUnitId;
    }

    public String getCourseUnitName() {
        return courseUnitName;
    }

    public void setCourseUnitName(String courseUnitName) {
        this.courseUnitName = courseUnitName;
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

    public Date getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(Date uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public Date getCachedAt() {
        return cachedAt;
    }

    public void setCachedAt(Date cachedAt) {
        this.cachedAt = cachedAt;
    }
}
