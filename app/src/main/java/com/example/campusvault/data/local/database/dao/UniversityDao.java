package com.example.campusvault.data.local.database.dao;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Transaction;

import com.example.campusvault.data.local.database.entity.CourseUnitEntity;
import com.example.campusvault.data.local.database.entity.FacultyEntity;
import com.example.campusvault.data.local.database.entity.ProgramEntity;

import java.util.List;

import io.reactivex.rxjava3.core.Flowable;

@Dao
public interface UniversityDao {

    // Faculty
    @Query("SELECT * FROM faculties")
    Flowable<List<FacultyEntity>> getFaculties();

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertFaculties(List<FacultyEntity> faculties);

    @Query("DELETE FROM faculties")
    void deleteAllFaculties();

    @Transaction
    default void updateFaculties(List<FacultyEntity> faculties) {
        deleteAllFaculties();
        insertFaculties(faculties);
    }

    // Program
    @Query("SELECT * FROM programs WHERE faculty_id = :facultyId")
    Flowable<List<ProgramEntity>> getPrograms(int facultyId);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertPrograms(List<ProgramEntity> programs);

    @Query("DELETE FROM programs")
    void deleteAllPrograms();

    @Transaction
    default void updatePrograms(List<ProgramEntity> programs) {
        deleteAllPrograms();
        insertPrograms(programs);
    }

    // Course Unit
    @Query("SELECT * FROM course_units WHERE (:programId IS NULL OR program_id = :programId) AND (:year IS NULL OR year = :year) AND (:semester IS NULL OR semester = :semester)")
    Flowable<List<CourseUnitEntity>> getCourseUnits(Integer programId, Integer year, Integer semester);

    @Query("SELECT * FROM course_units WHERE name LIKE '%' || :query || '%' OR code LIKE '%' || :query || '%'")
    Flowable<List<CourseUnitEntity>> searchCourseUnits(String query);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertCourseUnits(List<CourseUnitEntity> courseUnits);

    @Query("DELETE FROM course_units")
    void deleteAllCourseUnits();

    @Transaction
    default void updateCourseUnits(List<CourseUnitEntity> courseUnits) {
        deleteAllCourseUnits();
        insertCourseUnits(courseUnits);
    }
}
