package com.example.campusvault.data.mappers;

import com.example.campusvault.data.local.database.entity.ResourceEntity;
import com.example.campusvault.data.models.Resource;
import java.util.ArrayList;
import java.util.List;

/**
 * Mapper class for converting between Resource model and ResourceEntity
 */
public class ResourceMapper {

    /**
     * Convert Resource model to ResourceEntity for Room database
     */
    public static ResourceEntity toEntity(Resource resource) {
        if (resource == null) {
            return null;
        }

        ResourceEntity entity = new ResourceEntity();
        entity.setId(resource.getId());
        entity.setTitle(resource.getTitle());
        entity.setDescription(resource.getDescription());
        entity.setFileUrl(resource.getFileUrl());
        entity.setThumbnailUrl(resource.getThumbnailUrl());
        entity.setFileType(resource.getFileType());
        entity.setFileSize(resource.getFileSize());
        
        // Handle author
        if (resource.getAuthor() != null) {
            entity.setAuthorId(resource.getAuthor().getId());
            entity.setAuthorName(resource.getAuthor().getName());
        }
        
        entity.setCourseUnitId(resource.getCourseUnitId());
        entity.setTags(resource.getTags());
        entity.setDownloadCount(resource.getDownloadCount());
        entity.setAverageRating(resource.getAverageRating());
        entity.setBookmarked(resource.isBookmarked());
        entity.setUploadedAt(resource.getUploadedAt());
        
        return entity;
    }

    /**
     * Convert ResourceEntity to Resource model
     */
    public static Resource toModel(ResourceEntity entity) {
        if (entity == null) {
            return null;
        }

        Resource resource = new Resource();
        resource.setId(entity.getId());
        resource.setTitle(entity.getTitle());
        resource.setDescription(entity.getDescription());
        resource.setFileUrl(entity.getFileUrl());
        resource.setThumbnailUrl(entity.getThumbnailUrl());
        resource.setFileType(entity.getFileType());
        resource.setFileSize(entity.getFileSize());
        resource.setCourseUnitId(entity.getCourseUnitId());
        resource.setTags(entity.getTags());
        resource.setDownloadCount(entity.getDownloadCount());
        resource.setAverageRating(entity.getAverageRating());
        resource.setBookmarked(entity.isBookmarked());
        resource.setUploadedAt(entity.getUploadedAt());
        
        // Note: Author object is not fully reconstructed from entity
        // This would need to be fetched separately if needed
        
        return resource;
    }

    /**
     * Convert list of Resource models to list of ResourceEntity
     */
    public static List<ResourceEntity> toEntityList(List<Resource> resources) {
        if (resources == null) {
            return null;
        }

        List<ResourceEntity> entities = new ArrayList<>();
        for (Resource resource : resources) {
            entities.add(toEntity(resource));
        }
        return entities;
    }

    /**
     * Convert list of ResourceEntity to list of Resource models
     */
    public static List<Resource> toModelList(List<ResourceEntity> entities) {
        if (entities == null) {
            return null;
        }

        List<Resource> resources = new ArrayList<>();
        for (ResourceEntity entity : entities) {
            resources.add(toModel(entity));
        }
        return resources;
    }
}
