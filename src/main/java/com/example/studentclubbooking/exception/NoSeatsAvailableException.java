package com.example.studentclubbooking.exception;

public class NoSeatsAvailableException extends RuntimeException {
    public NoSeatsAvailableException(String message) {
        super(message);
    }
}
