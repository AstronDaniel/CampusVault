package com.example.campusvault.data.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

/**
 * Generic paginated response wrapper
 */
public class PaginatedResponse<T> {
    
    @SerializedName("items")
    private List<T> items;
    
    @SerializedName("total")
    private int total;
    
    @SerializedName("page")
    private int page;
    
    @SerializedName("page_size")
    private int pageSize;
    
    @SerializedName("has_next")
    private boolean hasNext;

    // Getters and Setters
    public List<T> getItems() {
        return items;
    }

    public void setItems(List<T> items) {
        this.items = items;
    }

    public int getTotal() {
        return total;
    }

    public void setTotal(int total) {
        this.total = total;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getPageSize() {
        return pageSize;
    }

    public void setPageSize(int pageSize) {
        this.pageSize = pageSize;
    }

    public boolean isHasNext() {
        return hasNext;
    }

    public void setHasNext(boolean hasNext) {
        this.hasNext = hasNext;
    }
}
