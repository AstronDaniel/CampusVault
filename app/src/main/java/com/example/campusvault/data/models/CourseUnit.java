package com.example.campusvault.data.models;

import com.google.gson.annotations.SerializedName;

/**
 * CourseUnit model representing an academic course
 */
public class CourseUnit {
    
    @SerializedName("id")
    private int id;
    
    @SerializedName("code")
    private String code;
    
    @SerializedName("name")
    private String name;
    
    @SerializedName("program_id")
    private int programId;
    
    @SerializedName("year")
    private int year;
    
    @SerializedName("semester")
    private int semester;

    // Getters and Setters
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getProgramId() { return programId; }

    public void setProgramId(int programId) { this.programId = programId; }

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }

    public int getSemester() {
        return semester;
    }

    public void setSemester(int semester) {
        this.semester = semester;
    }
}
