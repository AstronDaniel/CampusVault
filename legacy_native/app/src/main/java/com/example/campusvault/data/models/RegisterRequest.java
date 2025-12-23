package com.example.campusvault.data.models;

import com.google.gson.annotations.SerializedName;

/**
 * Request model for registration
 */
public class RegisterRequest {
    private String email;
    private String username;
    
    @SerializedName("faculty_id")
    private Integer facultyId;
    
    @SerializedName("program_id")
    private Integer programId;
    
    private String password;

    public RegisterRequest(String email, String username, Integer facultyId, Integer programId, String password) {
        this.email = email;
        this.username = username;
        this.facultyId = facultyId;
        this.programId = programId;
        this.password = password;
    }

    // Getters and Setters
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

    public Integer getFacultyId() {
        return facultyId;
    }

    public void setFacultyId(Integer facultyId) {
        this.facultyId = facultyId;
    }

    public Integer getProgramId() {
        return programId;
    }

    public void setProgramId(Integer programId) {
        this.programId = programId;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
