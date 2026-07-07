package com.project.BillX.util;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.project.BillX.model.Branch;
import com.project.BillX.model.Order;
import com.project.BillX.model.OrderItem;
import com.project.BillX.model.Product;
import com.project.BillX.dto.*;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class PdfReportGenerator {

    private final Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.DARK_GRAY);
    private final Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.GRAY);
    private final Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK);
    private final Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);

    public byte[] generateInvoicePdf(Order order) {
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Invoice Title
            Paragraph title = new Paragraph("BILLX INVOICE", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Branch & Order info
            Paragraph branchInfo = new Paragraph();
            branchInfo.add(new Phrase("Branch: " + order.getBranch().getName() + "\n", boldFont));
            if (order.getBranch().getAddress() != null) {
                branchInfo.add(new Phrase("Address: " + order.getBranch().getAddress() + "\n", normalFont));
            }
            branchInfo.add(new Phrase("Order No: " + order.getOrderNumber() + "\n", normalFont));
            branchInfo.add(new Phrase("Date: " + order.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) + "\n", normalFont));
            branchInfo.add(new Phrase("Cashier: " + order.getCashier().getFullName() + "\n", normalFont));
            if (order.getCustomer() != null) {
                branchInfo.add(new Phrase("Customer: " + order.getCustomer().getFullName() + " (" + order.getCustomer().getPhone() + ")\n", normalFont));
            }
            branchInfo.setSpacingAfter(20);
            document.add(branchInfo);

            // Table of items
            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{4, 1.5f, 2, 2.5f});

            addCell(table, "Product", boldFont, Color.LIGHT_GRAY, Element.ALIGN_LEFT);
            addCell(table, "Qty", boldFont, Color.LIGHT_GRAY, Element.ALIGN_CENTER);
            addCell(table, "Unit Price", boldFont, Color.LIGHT_GRAY, Element.ALIGN_RIGHT);
            addCell(table, "Line Total", boldFont, Color.LIGHT_GRAY, Element.ALIGN_RIGHT);

            for (OrderItem item : order.getItems()) {
                addCell(table, item.getProduct().getName(), normalFont, null, Element.ALIGN_LEFT);
                addCell(table, String.valueOf(item.getQuantity()), normalFont, null, Element.ALIGN_CENTER);
                addCell(table, "INR " + item.getUnitPrice(), normalFont, null, Element.ALIGN_RIGHT);
                addCell(table, "INR " + item.getLineTotal(), normalFont, null, Element.ALIGN_RIGHT);
            }

            table.setSpacingAfter(20);
            document.add(table);

            // Totals info
            Paragraph totals = new Paragraph();
            totals.setAlignment(Element.ALIGN_RIGHT);
            totals.add(new Phrase("Subtotal: INR " + order.getSubtotal() + "\n", normalFont));
            if (order.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
                totals.add(new Phrase("Discount: (" + order.getDiscountType() + ") INR " + order.getDiscountAmount() + "\n", normalFont));
            }
            totals.add(new Phrase("Tax: INR " + order.getTaxAmount() + "\n", normalFont));
            totals.add(new Phrase("Total: INR " + order.getTotalAmount() + "\n", boldFont));
            totals.add(new Phrase("Status: " + order.getStatus() + "\n", boldFont));
            document.add(totals);

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Error generating Invoice PDF", e);
        }

        return out.toByteArray();
    }

    public byte[] generateWeeklyReportPdf(Branch branch, LocalDate start, LocalDate end,
                                          BigDecimal totalSales, Long orderCount, BigDecimal totalRefunds,
                                          List<ReportDataPoint> paymentBreakdown, List<ReportDataPoint> topProducts,
                                          List<ReportDataPoint> cashierPerformance, List<ReportDataPoint> categorySales,
                                          List<Product> lowStockProducts) {
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Report Header
            Paragraph title = new Paragraph("WEEKLY REPORT - " + branch.getName().toUpperCase(), titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(5);
            document.add(title);

            Paragraph subtitle = new Paragraph("Period: " + start + " to " + end, sectionFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(20);
            document.add(subtitle);

            // Sales Summary
            Paragraph summaryTitle = new Paragraph("Sales Summary", boldFont);
            summaryTitle.setSpacingAfter(5);
            document.add(summaryTitle);

            PdfPTable summaryTable = new PdfPTable(4);
            summaryTable.setWidthPercentage(100);
            addCell(summaryTable, "Total Revenue", boldFont, Color.LIGHT_GRAY, Element.ALIGN_CENTER);
            addCell(summaryTable, "Total Orders", boldFont, Color.LIGHT_GRAY, Element.ALIGN_CENTER);
            addCell(summaryTable, "Total Refunds", boldFont, Color.LIGHT_GRAY, Element.ALIGN_CENTER);
            addCell(summaryTable, "Average Order Value", boldFont, Color.LIGHT_GRAY, Element.ALIGN_CENTER);

            addCell(summaryTable, "INR " + totalSales, normalFont, null, Element.ALIGN_CENTER);
            addCell(summaryTable, String.valueOf(orderCount), normalFont, null, Element.ALIGN_CENTER);
            addCell(summaryTable, "INR " + totalRefunds, normalFont, null, Element.ALIGN_CENTER);
            BigDecimal avg = orderCount > 0 ? totalSales.subtract(totalRefunds).divide(BigDecimal.valueOf(orderCount), 2, BigDecimal.ROUND_HALF_UP) : BigDecimal.ZERO;
            addCell(summaryTable, "INR " + avg, normalFont, null, Element.ALIGN_CENTER);
            summaryTable.setSpacingAfter(20);
            document.add(summaryTable);

            // Payment Breakdown
            document.add(new Paragraph("Payment Breakdown", boldFont));
            PdfPTable payTable = new PdfPTable(3);
            payTable.setWidthPercentage(100);
            addCell(payTable, "Method", boldFont, Color.LIGHT_GRAY, Element.ALIGN_LEFT);
            addCell(payTable, "Sales", boldFont, Color.LIGHT_GRAY, Element.ALIGN_RIGHT);
            addCell(payTable, "Count", boldFont, Color.LIGHT_GRAY, Element.ALIGN_CENTER);
            for (ReportDataPoint dp : paymentBreakdown) {
                addCell(payTable, dp.getLabel(), normalFont, null, Element.ALIGN_LEFT);
                addCell(payTable, "INR " + dp.getValue(), normalFont, null, Element.ALIGN_RIGHT);
                addCell(payTable, String.valueOf(dp.getCount()), normalFont, null, Element.ALIGN_CENTER);
            }
            payTable.setSpacingAfter(20);
            document.add(payTable);

            // Top 5 Products
            document.add(new Paragraph("Top Products", boldFont));
            PdfPTable prodTable = new PdfPTable(3);
            prodTable.setWidthPercentage(100);
            addCell(prodTable, "Product", boldFont, Color.LIGHT_GRAY, Element.ALIGN_LEFT);
            addCell(prodTable, "Units Sold", boldFont, Color.LIGHT_GRAY, Element.ALIGN_CENTER);
            addCell(prodTable, "Revenue", boldFont, Color.LIGHT_GRAY, Element.ALIGN_RIGHT);
            for (ReportDataPoint dp : topProducts) {
                addCell(prodTable, dp.getLabel(), normalFont, null, Element.ALIGN_LEFT);
                addCell(prodTable, String.valueOf(dp.getCount()), normalFont, null, Element.ALIGN_CENTER);
                addCell(prodTable, "INR " + dp.getValue(), normalFont, null, Element.ALIGN_RIGHT);
            }
            prodTable.setSpacingAfter(20);
            document.add(prodTable);

            // Cashier Performance
            document.add(new Paragraph("Cashier Performance", boldFont));
            PdfPTable cashTable = new PdfPTable(3);
            cashTable.setWidthPercentage(100);
            addCell(cashTable, "Cashier Name", boldFont, Color.LIGHT_GRAY, Element.ALIGN_LEFT);
            addCell(cashTable, "Sales", boldFont, Color.LIGHT_GRAY, Element.ALIGN_RIGHT);
            addCell(cashTable, "Orders", boldFont, Color.LIGHT_GRAY, Element.ALIGN_CENTER);
            for (ReportDataPoint dp : cashierPerformance) {
                addCell(cashTable, dp.getLabel(), normalFont, null, Element.ALIGN_LEFT);
                addCell(cashTable, "INR " + dp.getValue(), normalFont, null, Element.ALIGN_RIGHT);
                addCell(cashTable, String.valueOf(dp.getCount()), normalFont, null, Element.ALIGN_CENTER);
            }
            cashTable.setSpacingAfter(20);
            document.add(cashTable);

            // Category Sales
            document.add(new Paragraph("Category-wise Sales", boldFont));
            PdfPTable catTable = new PdfPTable(2);
            catTable.setWidthPercentage(100);
            addCell(catTable, "Category", boldFont, Color.LIGHT_GRAY, Element.ALIGN_LEFT);
            addCell(catTable, "Sales Value", boldFont, Color.LIGHT_GRAY, Element.ALIGN_RIGHT);
            for (ReportDataPoint dp : categorySales) {
                addCell(catTable, dp.getLabel(), normalFont, null, Element.ALIGN_LEFT);
                addCell(catTable, "INR " + dp.getValue(), normalFont, null, Element.ALIGN_RIGHT);
            }
            catTable.setSpacingAfter(20);
            document.add(catTable);

            // Low Stock Items
            document.add(new Paragraph("Low Stock Items (Current)", boldFont));
            PdfPTable lowStockTable = new PdfPTable(3);
            lowStockTable.setWidthPercentage(100);
            addCell(lowStockTable, "Product", boldFont, Color.LIGHT_GRAY, Element.ALIGN_LEFT);
            addCell(lowStockTable, "Available Stock", boldFont, Color.LIGHT_GRAY, Element.ALIGN_CENTER);
            addCell(lowStockTable, "Threshold", boldFont, Color.LIGHT_GRAY, Element.ALIGN_CENTER);
            for (Product p : lowStockProducts) {
                addCell(lowStockTable, p.getName(), normalFont, null, Element.ALIGN_LEFT);
                addCell(lowStockTable, String.valueOf(p.getStockQuantity()), normalFont, null, Element.ALIGN_CENTER);
                addCell(lowStockTable, String.valueOf(p.getLowStockThreshold()), normalFont, null, Element.ALIGN_CENTER);
            }
            lowStockTable.setSpacingAfter(20);
            document.add(lowStockTable);

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Error generating Weekly Report PDF", e);
        }

        return out.toByteArray();
    }

    private void addCell(PdfPTable table, String text, Font font, Color bgColor, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(alignment);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(5);
        if (bgColor != null) {
            cell.setBackgroundColor(bgColor);
        }
        table.addCell(cell);
    }
}
