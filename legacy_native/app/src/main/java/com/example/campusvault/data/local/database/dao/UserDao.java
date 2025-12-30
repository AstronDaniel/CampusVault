package com.example.campusvault.data.local.database.dao;

import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;
import com.example.campusvault.data.local.database.entity.UserEntity;
import io.reactivex.rxjava3.core.Completable;
import io.reactivex.rxjava3.core.Single;

/**
 * Data Access Object for User entity
 */
@Dao
public interface UserDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    Completable insert(UserEntity user);

    @Update
    Completable update(UserEntity user);

    @Delete
    Completable delete(UserEntity user);

    @Query("SELECT * FROM users WHERE id = :userId")
    Single<UserEntity> getUserById(int userId);

    @Query("SELECT * FROM users WHERE email = :email")
    Single<UserEntity> getUserByEmail(String email);

    @Query("DELETE FROM users")
    Completable deleteAll();

    @Query("SELECT COUNT(*) FROM users")
    Single<Integer> getUserCount();
}
