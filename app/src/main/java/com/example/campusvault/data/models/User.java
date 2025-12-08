package com.example.campusvault.data.models;

import com.google.gson.annotations.SerializedName;
import java.util.Date;

/**
 * User model matching backend UserRead schema
 */
public class User {
    
    @SerializedName("id")
    private int id;
    
    @SerializedName("email")
    private String email;
    
    @SerializedName("username")
    private String username;

    @SerializedName("first_name")
    private String firstName;

    @SerializedName("last_name")
    private String lastName;
    
    @SerializedName("faculty_id")
    private int facultyId;
    
    @SerializedName("program_id")
    private int programId;
    
    @SerializedName("role")
    private String role;
    
    @SerializedName("avatar_url")
    private String avatarUrl;

    @SerializedName("banner_url")
    private String bannerUrl;
    
    @SerializedName("is_verified")
    private boolean isVerified;
    
    @SerializedName("created_at")
    private Date createdAt;

    // Getters and Setters
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public int getFacultyId() {
        return facultyId;
    }

    public void setFacultyId(int facultyId) {
        this.facultyId = facultyId;
    }

    public int getProgramId() {
        return programId;
    }

    public void setProgramId(int programId) {
        this.programId = programId;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getBannerUrl() {
        return bannerUrl;
    }

    public void setBannerUrl(String bannerUrl) {
        this.bannerUrl = bannerUrl;
    }

    public boolean isVerified() {
        return isVerified;
    }

    public void setVerified(boolean verified) {
        isVerified = verified;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    // Backward compatibility - some code may still call getName()
    public String getName() {
        return username;
    }

    public void setName(String name) {
        this.username = name;
    }
}
