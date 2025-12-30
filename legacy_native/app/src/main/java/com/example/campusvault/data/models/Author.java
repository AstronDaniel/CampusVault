package com.example.campusvault.data.models;

public class Author {
    private int id;
    private String firstName;
    private String lastName;

    // Getters and setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    /**
     * Convenience accessor used throughout the app for display purposes.
     */
    public String getName() {
        StringBuilder builder = new StringBuilder();
        if (firstName != null && !firstName.isEmpty()) {
            builder.append(firstName);
        }
        if (lastName != null && !lastName.isEmpty()) {
            if (builder.length() > 0) {
                builder.append(" ");
            }
            builder.append(lastName);
        }
        return builder.length() > 0 ? builder.toString() : "";
    }

    public void setName(String name) {
        this.firstName = name;
        this.lastName = "";
    }
}
