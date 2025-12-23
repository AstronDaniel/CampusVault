package com.example.campusvault.data.repository;

import android.app.Application;
import android.content.Context;

import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.local.database.AppDatabase;
import com.example.campusvault.data.local.database.dao.UniversityDao;
import com.example.campusvault.data.local.database.entity.CourseUnitEntity;
import com.example.campusvault.data.local.database.entity.FacultyEntity;
import com.example.campusvault.data.local.database.entity.ProgramEntity;
import com.example.campusvault.data.models.CourseUnit;
import com.example.campusvault.data.models.FacultyResponse;
import com.example.campusvault.data.models.ProgramResponse;

import java.util.List;
import java.util.stream.Collectors;

import io.reactivex.rxjava3.core.Completable;
import io.reactivex.rxjava3.core.Flowable;
import io.reactivex.rxjava3.schedulers.Schedulers;

public class UniversityRepository {
    private final UniversityDao dao;
    private final ApiService api;

    public UniversityRepository(Application application, ApiService api) {
        AppDatabase db = AppDatabase.getInstance((Context) application);
        this.dao = db.universityDao();
        this.api = api;
    }

    // Faculty
    public Flowable<List<FacultyResponse>> getFaculties() {
        return dao.getFaculties()
                .map(this::mapFacultyEntitiesToResponses)
                .subscribeOn(Schedulers.io());
    }

    public Completable refreshFaculties() {
        return api.getFaculties()
                .subscribeOn(Schedulers.io())
                .map(this::mapFacultyResponsesToEntities)
                .flatMapCompletable(entities -> Completable.fromAction(() -> dao.updateFaculties(entities)));
    }

    // Program
    public Flowable<List<ProgramResponse>> getPrograms(int facultyId) {
        return dao.getPrograms(facultyId)
                .map(this::mapProgramEntitiesToResponses)
                .subscribeOn(Schedulers.io());
    }

    public Completable refreshPrograms(int facultyId) {
        return api.getPrograms(facultyId)
                .subscribeOn(Schedulers.io())
                .map(this::mapProgramResponsesToEntities)
                .flatMapCompletable(entities -> Completable.fromAction(() -> dao.updatePrograms(entities)));
    }

    // Course Unit - ACCEPTS NULLABLE INTEGERS
    public Flowable<List<CourseUnit>> getCourseUnits(Integer programId, Integer year, Integer semester) {
        return dao.getCourseUnits(programId, year, semester)
                .map(this::mapCourseUnitEntitiesToModels)
                .subscribeOn(Schedulers.io());
    }

    public Flowable<List<CourseUnit>> searchCourseUnits(String query) {
        return dao.searchCourseUnits(query)
                .map(this::mapCourseUnitEntitiesToModels)
                .subscribeOn(Schedulers.io());
    }

    public Flowable<List<CourseUnit>> searchCourseUnitsByProgram(Integer programId, String query) {
        if (programId == null || programId <= 0) {
            // Fallback to global search if no programId
            return searchCourseUnits(query);
        }
        return dao.searchCourseUnitsByProgram(programId, query)
                .map(this::mapCourseUnitEntitiesToModels)
                .subscribeOn(Schedulers.io());
    }

    public Completable refreshCourseUnits(Integer programId, Integer year, Integer semester) {
        return api.getCourseUnits(programId, year, semester)
                .subscribeOn(Schedulers.io())
                .map(this::mapCourseUnitModelsToEntities)
                .flatMapCompletable(entities -> Completable.fromAction(() -> dao.updateCourseUnits(entities)));
    }

    // Mappers
    private List<FacultyResponse> mapFacultyEntitiesToResponses(List<FacultyEntity> entities) {
        return entities.stream().map(e -> {
            FacultyResponse r = new FacultyResponse();
            r.setId(e.getId());
            r.setName(e.getName());
            r.setCode(e.getCode());
            return r;
        }).collect(Collectors.toList());
    }

    private List<FacultyEntity> mapFacultyResponsesToEntities(List<FacultyResponse> responses) {
        return responses.stream().map(r -> {
            FacultyEntity e = new FacultyEntity();
            e.setId(r.getId());
            e.setName(r.getName());
            e.setCode(r.getCode());
            return e;
        }).collect(Collectors.toList());
    }

    private List<ProgramResponse> mapProgramEntitiesToResponses(List<ProgramEntity> entities) {
        return entities.stream().map(e -> {
            ProgramResponse r = new ProgramResponse();
            r.setId(e.getId());
            r.setName(e.getName());
            r.setCode(e.getCode());
            r.setFacultyId(e.getFacultyId());
            r.setDurationYears(e.getDurationYears());
            return r;
        }).collect(Collectors.toList());
    }

    private List<ProgramEntity> mapProgramResponsesToEntities(List<ProgramResponse> responses) {
        return responses.stream().map(r -> {
            ProgramEntity e = new ProgramEntity();
            e.setId(r.getId());
            e.setName(r.getName());
            e.setCode(r.getCode());
            e.setFacultyId(r.getFacultyId());
            e.setDurationYears(r.getDurationYears());
            return e;
        }).collect(Collectors.toList());
    }

    private List<CourseUnit> mapCourseUnitEntitiesToModels(List<CourseUnitEntity> entities) {
        return entities.stream().map(e -> {
            CourseUnit m = new CourseUnit();
            m.setId(e.getId());
            m.setName(e.getName());
            m.setCode(e.getCode());
            m.setProgramId(e.getProgramId());
            m.setYear(e.getYear());
            m.setSemester(e.getSemester());
            return m;
        }).collect(Collectors.toList());
    }

    private List<CourseUnitEntity> mapCourseUnitModelsToEntities(List<CourseUnit> models) {
        return models.stream().map(m -> {
            CourseUnitEntity e = new CourseUnitEntity();
            e.setId(m.getId());
            e.setName(m.getName());
            e.setCode(m.getCode());
            e.setProgramId(m.getProgramId());
            e.setYear(m.getYear());
            e.setSemester(m.getSemester());
            return e;
        }).collect(Collectors.toList());
    }
}
