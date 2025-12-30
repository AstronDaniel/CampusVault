package com.example.campusvault.data;

/**
 * A generic wrapper class for API responses and data operations
 * Represents the state of data loading: Success, Error, or Loading
 */
public class Result<T> {

    private final Status status;
    private final T data;
    private final String message;

    private Result(Status status, T data, String message) {
        this.status = status;
        this.data = data;
        this.message = message;
    }

    /**
     * Create a success result with data
     */
    public static <T> Result<T> success(T data) {
        return new Result<>(Status.SUCCESS, data, null);
    }

    /**
     * Create an error result with message
     */
    public static <T> Result<T> error(String message) {
        return new Result<>(Status.ERROR, null, message);
    }

    /**
     * Create an error result with message and data
     */
    public static <T> Result<T> error(String message, T data) {
        return new Result<>(Status.ERROR, data, message);
    }

    /**
     * Create a loading result
     */
    public static <T> Result<T> loading() {
        return new Result<>(Status.LOADING, null, null);
    }

    /**
     * Create a loading result with data (for showing cached data while loading)
     */
    public static <T> Result<T> loading(T data) {
        return new Result<>(Status.LOADING, data, null);
    }

    public Status getStatus() {
        return status;
    }

    public T getData() {
        return data;
    }

    public String getMessage() {
        return message;
    }

    public boolean isSuccess() {
        return status == Status.SUCCESS;
    }

    public boolean isError() {
        return status == Status.ERROR;
    }

    public boolean isLoading() {
        return status == Status.LOADING;
    }

    public enum Status {
        SUCCESS,
        ERROR,
        LOADING
    }
}
