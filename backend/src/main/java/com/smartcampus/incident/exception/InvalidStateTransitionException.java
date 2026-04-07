package com.smartcampus.incident.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a requested ticket state transition is invalid per the state machine rules.
 */
@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
public class InvalidStateTransitionException extends RuntimeException {

    public InvalidStateTransitionException(String fromState, String toState) {
        super(String.format("Invalid state transition from '%s' to '%s'", fromState, toState));
    }
}
