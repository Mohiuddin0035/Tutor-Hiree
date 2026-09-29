package com.tuitionbd.backend.payload.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignupRequest {
    @NotBlank
    @Size(min = 3, max = 50)
    private String name;

    @NotBlank
    @Size(max = 50)
    @Email
    private String email;

    private String role;

    @NotBlank
    @Size(min = 6, max = 40)
    private String password;

    private String phone;
    private String address;
    private String education;
    private String bio;
    private Double latitude;
    private Double longitude;
    private Double actualLatitude;
    private Double actualLongitude;
    private String gender;
    private String preferable_time;
    private String nidImageUrl;
    private String universityIdImageUrl;
    private String selfieImageUrl;
}
