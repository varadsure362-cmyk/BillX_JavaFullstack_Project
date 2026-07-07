package com.project.BillX.service;

import com.project.BillX.dto.*;
import java.util.List;

public interface AlertService {
    List<AlertResponse> getUnreadAlerts(Long branchId);
    List<AlertResponse> getAllAlerts(Long branchId);
    AlertResponse markAsRead(Long alertId);
}
