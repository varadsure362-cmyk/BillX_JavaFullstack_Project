package com.project.BillX.util;

import com.project.BillX.model.Role;
import com.project.BillX.exception.ForbiddenException;
import com.project.BillX.security.UserPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class BranchAccessValidator {

    public void validateBranchAccess(Long branchId) {
        if (branchId == null) {
            throw new ForbiddenException("Branch ID is required");
        }
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof UserPrincipal)) {
            throw new ForbiddenException("Invalid authentication principal");
        }
        UserPrincipal userPrincipal = (UserPrincipal) principal;

        if (Role.CASHIER.name().equals(userPrincipal.getRole())) {
            if (!branchId.equals(userPrincipal.getBranchId())) {
                throw new ForbiddenException("Cashier can only access data for their assigned branch");
            }
        } else if (Role.MANAGER.name().equals(userPrincipal.getRole())) {
            if (!userPrincipal.getManagedBranchIds().contains(branchId)) {
                throw new ForbiddenException("Manager does not oversee branch with ID: " + branchId);
            }
        } else {
            throw new ForbiddenException("Invalid user role");
        }
    }

    public UserPrincipal getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof UserPrincipal)) {
            throw new ForbiddenException("User not authenticated");
        }
        return (UserPrincipal) principal;
    }
}
