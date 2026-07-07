package com.project.BillX.repository;

import com.project.BillX.model.User;
import com.project.BillX.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findAllByBranchId(Long branchId);

    List<User> findAllByRole(Role role);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u JOIN u.managedBranches b WHERE b.id = :branchId")
    List<User> findManagersManagingBranch(@org.springframework.data.repository.query.Param("branchId") Long branchId);
}
