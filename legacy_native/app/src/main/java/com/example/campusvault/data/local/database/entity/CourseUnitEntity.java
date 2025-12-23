package com.example.campusvault.data.local.database.entity;

import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.PrimaryKey;
import java.util.Date;

@Entity(tableName = "course_units")
public class CourseUnitEntity {
    @PrimaryKey
    @ColumnInfo(name = "id")
    private int id;

    @ColumnInfo(name = "code")
    private String code;

    @ColumnInfo(name = "name")
    private String name;

    @ColumnInfo(name = "program_id")
    private int programId;

    @ColumnInfo(name = "year")
    private int year;

    @ColumnInfo(name = "semester")
    private int semester;

    @ColumnInfo(name = "cached_at")
    private Date cachedAt;

    public CourseUnitEntity() {
        this.cachedAt = new Date();
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getProgramId() { return programId; }
    public void setProgramId(int programId) { this.programId = programId; }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public int getSemester() { return semester; }
    public void setSemester(int semester) { this.semester = semester; }

    public Date getCachedAt() { return cachedAt; }
    public void setCachedAt(Date cachedAt) { this.cachedAt = cachedAt; }
}
