package com.example.campusvault.data.repository;

import android.app.Application;
import android.content.Context;
import androidx.lifecycle.LiveData;
import com.example.campusvault.data.local.database.AppDatabase;
import com.example.campusvault.data.local.database.dao.ResourceDao;
import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.local.database.entity.ResourceEntity;
import com.example.campusvault.data.models.Author;
import com.example.campusvault.data.models.CourseUnitInfo;
import com.example.campusvault.data.models.Resource;
import io.reactivex.rxjava3.core.Completable;
import io.reactivex.rxjava3.core.Flowable;
import io.reactivex.rxjava3.schedulers.Schedulers;
import java.util.List;
import java.util.stream.Collectors;

public class ResourceRepository {
    private final ResourceDao resourceDao;
    private final ApiService apiService;

    public ResourceRepository(Application application, ApiService apiService) {
        AppDatabase db = AppDatabase.getInstance((Context) application);
        this.resourceDao = db.resourceDao();
        this.apiService = apiService;
    }

    public Flowable<List<Resource>> getBookmarkedResources() {
        return resourceDao.getBookmarkedResources()
                .map(this::mapEntitiesToModels)
                .subscribeOn(Schedulers.io());
    }

    // Recent Resources
    public Flowable<List<Resource>> getRecentResources() {
        return resourceDao.getRecentResources(20)
                .map(this::mapEntitiesToModels)
                .subscribeOn(Schedulers.io());
    }

    public Completable refreshRecentResources() {
        return apiService.getRecentResources(1, 20)
                .subscribeOn(Schedulers.io())
                .map(response -> mapModelsToEntities(response.getItems()))
                .flatMapCompletable(entities -> resourceDao.insertAll(entities));
    }

    // Trending Resources
    public Flowable<List<Resource>> getTrendingResources() {
        return resourceDao.getTrendingResources(20)
                .map(this::mapEntitiesToModels)
                .subscribeOn(Schedulers.io());
    }

    public Completable refreshTrendingResources() {
        return apiService.getTrendingResources(1, 20)
                .subscribeOn(Schedulers.io())
                .map(response -> mapModelsToEntities(response.getItems()))
                .flatMapCompletable(entities -> resourceDao.insertAll(entities));
    }

    // Course Unit Resources
    public Flowable<List<Resource>> getResourcesByCourseUnit(int courseUnitId, String type) {
        if (type == null) {
            return resourceDao.getResourcesByCourseUnit(courseUnitId)
                    .map(this::mapEntitiesToModels)
                    .subscribeOn(Schedulers.io());
        } else {
            return resourceDao.getResourcesByCourseUnitAndType(courseUnitId, type)
                    .map(this::mapEntitiesToModels)
                    .subscribeOn(Schedulers.io());
        }
    }

    public Completable refreshResourcesByCourseUnit(int courseUnitId, String type) {
        return apiService.getResources(1, 100, null, null, courseUnitId, null, null, type)
                .subscribeOn(Schedulers.io())
                .map(response -> mapModelsToEntities(response.getItems()))
                .flatMapCompletable(entities -> resourceDao.insertAll(entities));
    }

    // Mappers
    private List<Resource> mapEntitiesToModels(List<ResourceEntity> entities) {
        return entities.stream().map(e -> {
            Resource r = new Resource();
            r.setId(e.getId());
            r.setTitle(e.getTitle());
            r.setDescription(e.getDescription());
            r.setFileUrl(e.getFileUrl());
            r.setThumbnailUrl(e.getThumbnailUrl());
            r.setFileType(e.getFileType());
            r.setFileSize(e.getFileSize());
            r.setDownloadCount(e.getDownloadCount());
            r.setAverageRating(e.getAverageRating());
            r.setBookmarked(e.isBookmarked());
            r.setUploadedAt(e.getUploadedAt());
            
            // Basic author info
            Author author = new Author();
            author.setId(e.getAuthorId());
            author.setName(e.getAuthorName());
            r.setAuthor(author);
            
            // Basic course unit info
            CourseUnitInfo cu = new CourseUnitInfo();
            cu.setId(e.getCourseUnitId() != null ? e.getCourseUnitId() : 0);
            cu.setName(e.getCourseUnitName());
            r.setCourseUnit(cu);
            
            r.setTags(e.getTags());
            r.setResourceType(e.getResourceType());
            return r;
        }).collect(Collectors.toList());
    }

    private List<ResourceEntity> mapModelsToEntities(List<Resource> models) {
        return models.stream().map(m -> {
            ResourceEntity e = new ResourceEntity();
            e.setId(m.getId());
            e.setTitle(m.getTitle() != null ? m.getTitle() : "Untitled");
            e.setDescription(m.getDescription());
            e.setFileUrl(m.getFileUrl());
            e.setThumbnailUrl(m.getThumbnailUrl());
            e.setFileType(m.getFileType());
            e.setFileSize(m.getFileSize());
            e.setDownloadCount(m.getDownloadCount());
            e.setAverageRating(m.getAverageRating());
            e.setBookmarked(m.isBookmarked());
            e.setUploadedAt(m.getUploadedAt());
            
            // Handle author - may be null or present
            if (m.getAuthor() != null) {
                e.setAuthorId(m.getAuthor().getId());
                e.setAuthorName(m.getAuthor().getName());
            } else {
                e.setAuthorId(0);
                e.setAuthorName("Unknown");
            }
            
            // Handle course unit - may be null or present  
            if (m.getCourseUnit() != null) {
                e.setCourseUnitId(m.getCourseUnit().getId());
                e.setCourseUnitName(m.getCourseUnit().getName());
            } else if (m.getCourseUnitId() != null) {
                // Use direct course_unit_id from API
                e.setCourseUnitId(m.getCourseUnitId());
                e.setCourseUnitName(null);
            } else {
                e.setCourseUnitId(null);
                e.setCourseUnitName(null);
            }
            
            e.setTags(m.getTags());
            e.setResourceType(m.getResourceType());
            return e;
        }).collect(Collectors.toList());
    }
}
