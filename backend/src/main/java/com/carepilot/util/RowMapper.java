package com.carepilot.util;

@FunctionalInterface
public interface RowMapper<T> {
    T map(String[] cols);
}


