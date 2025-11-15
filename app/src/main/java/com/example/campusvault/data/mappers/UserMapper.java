package com.example.campusvault.data.mappers;

import com.example.campusvault.data.local.database.entity.UserEntity;
import com.example.campusvault.data.models.User;

/**
 * Mapper class for converting between User model and UserEntity
 */
public class UserMapper {

    /**
     * Convert User model to UserEntity for Room database
     */
    public static UserEntity toEntity(User user) {
        if (user == null) {
            return null;
        }

        UserEntity entity = new UserEntity();
        entity.setId(user.getId());
        entity.setEmail(user.getEmail());
        entity.setName(user.getUsername()); // Updated to use username
        entity.setRole(user.getRole());
        entity.setAvatarUrl(user.getAvatarUrl());
        entity.setCreatedAt(user.getCreatedAt());
        
        return entity;
    }

    /**
     * Convert UserEntity to User model
     */
    public static User toModel(UserEntity entity) {
        if (entity == null) {
            return null;
        }

        User user = new User();
        user.setId(entity.getId());
        user.setEmail(entity.getEmail());
        user.setUsername(entity.getName()); // Map name to username
        user.setRole(entity.getRole());
        user.setAvatarUrl(entity.getAvatarUrl());
        user.setCreatedAt(entity.getCreatedAt());
        
        return user;
    }
}
