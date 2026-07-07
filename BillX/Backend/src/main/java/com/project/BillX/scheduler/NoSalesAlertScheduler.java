package com.project.BillX.scheduler;

import com.project.BillX.model.Alert;
import com.project.BillX.model.AlertType;
import com.project.BillX.model.Branch;
import com.project.BillX.model.Product;
import com.project.BillX.repository.AlertRepository;
import com.project.BillX.repository.BranchRepository;
import com.project.BillX.repository.OrderItemRepository;
import com.project.BillX.repository.ProductRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Component
@Slf4j
public class NoSalesAlertScheduler {

    private final BranchRepository branchRepository;
    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    private final AlertRepository alertRepository;

    public NoSalesAlertScheduler(BranchRepository branchRepository,
                                 ProductRepository productRepository,
                                 OrderItemRepository orderItemRepository,
                                 AlertRepository alertRepository) {
        this.branchRepository = branchRepository;
        this.productRepository = productRepository;
        this.orderItemRepository = orderItemRepository;
        this.alertRepository = alertRepository;
    }

    @Scheduled(cron = "0 0 1 * * ?") // Every day at 1 AM
    public void flagNoSalesProducts() {
        log.info("Starting daily check for products with no sales in the last 7 days...");
        try {
            LocalDateTime since = LocalDateTime.now().minusDays(7);
            List<Branch> branches = branchRepository.findAll();

            for (Branch branch : branches) {
                List<Long> soldProductIds = orderItemRepository.findAll().stream()
                        .filter(oi -> oi.getOrder().getBranch().getId().equals(branch.getId())
                                && oi.getOrder().getCreatedAt().isAfter(since))
                        .map(oi -> oi.getProduct().getId())
                        .distinct()
                        .collect(Collectors.toList());

                List<Product> products = productRepository.findByBranchId(branch.getId());

                for (Product product : products) {
                    if (!soldProductIds.contains(product.getId())) {
                        boolean alreadyAlerted = alertRepository.existsByBranchIdAndTypeAndReferenceIdAndIsReadFalseAndCreatedAtAfter(
                                branch.getId(),
                                AlertType.NO_SALES,
                                product.getId(),
                                LocalDateTime.now().minusDays(7)
                        );

                        if (!alreadyAlerted) {
                            Alert alert = Alert.builder()
                                    .branch(branch)
                                    .type(AlertType.NO_SALES)
                                    .message("Product '" + product.getName() + "' (SKU: " + product.getSku() + ") had zero sales in the last 7 days.")
                                    .referenceId(product.getId())
                                    .isRead(false)
                                    .build();
                            alertRepository.save(alert);
                            log.info("Flagged NO_SALES product: {} in branch: {}", product.getName(), branch.getName());
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to flag products with no sales", e);
        }
    }
}
