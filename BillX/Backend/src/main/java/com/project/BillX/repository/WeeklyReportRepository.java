package com.project.BillX.repository;

import com.project.BillX.model.WeeklyReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WeeklyReportRepository extends JpaRepository<WeeklyReport, Long> {
    List<WeeklyReport> findByBranchId(Long branchId);
}
