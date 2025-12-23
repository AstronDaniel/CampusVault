package com.example.campusvault.data.models;

import com.google.gson.annotations.SerializedName;

/**
 * Program response model matching backend ProgramRead schema
 */
public class ProgramResponse {
    
    @SerializedName("id")
    private int id;
    
    @SerializedName("name")
    private String name;
    
    @SerializedName("code")
    private String code;
    
    @SerializedName("faculty_id")
    private int facultyId;
    
    @SerializedName("duration_years")
    private int durationYears;

    // Getters and Setters
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public int getFacultyId() {
        return facultyId;
    }

    public void setFacultyId(int facultyId) {
        this.facultyId = facultyId;
    }

    public int getDurationYears() {
        return durationYears;
    }

    public void setDurationYears(int durationYears) {
        this.durationYears = durationYears;
    }

    @Override
    public String toString() {
        return name; // For Spinner display
    }
}
