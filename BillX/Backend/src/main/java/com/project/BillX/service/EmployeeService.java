package com.project.BillX.service;

import com.project.BillX.dto.*;
import java.util.List;

public interface EmployeeService {
    UserResponse createEmployee(CreateEmployeeRequest request);
    List<UserResponse> getEmployees(Long branchId);
    UserResponse updateEmployee(Long id, CreateEmployeeRequest request);
    void deleteEmployee(Long id);
}
