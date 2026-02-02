package com.carepilot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;


@SpringBootApplication
@EnableScheduling
public class CarepilotApplication {

	public static void main(String[] args) {
		SpringApplication.run(CarepilotApplication.class, args);
	}

}
