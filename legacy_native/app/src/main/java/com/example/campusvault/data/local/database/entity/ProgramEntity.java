package com.example.campusvault.data.local.database.entity;

import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.PrimaryKey;
import java.util.Date;

@Entity(tableName = "programs")
public class ProgramEntity {
    @PrimaryKey
    @ColumnInfo(name = "id")
    private int id;

    @ColumnInfo(name = "name")
    private String name;

    @ColumnInfo(name = "code")
    private String code;

    @ColumnInfo(name = "faculty_id")
    private int facultyId;

    @ColumnInfo(name = "duration_years")
    private int durationYears;

    @ColumnInfo(name = "cached_at")
    private Date cachedAt;

    public ProgramEntity() {
        this.cachedAt = new Date();
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public int getFacultyId() { return facultyId; }
    public void setFacultyId(int facultyId) { this.facultyId = facultyId; }

    public int getDurationYears() { return durationYears; }
    public void setDurationYears(int durationYears) { this.durationYears = durationYears; }

    public Date getCachedAt() { return cachedAt; }
    public void setCachedAt(Date cachedAt) { this.cachedAt = cachedAt; }
}
