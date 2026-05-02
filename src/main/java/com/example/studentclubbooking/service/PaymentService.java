package com.example.studentclubbooking.service;

import com.example.studentclubbooking.model.TransactionStatus;
import lombok.Getter;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Random;
import java.util.UUID;

/**
 * Mock payment gateway — 80% success rate.
 * Returns a PaymentResult containing the TransactionStatus and a gateway reference.
 */
@Service
public class PaymentService {

    private final Random random = new Random();

    public PaymentResult simulatePayment(BigDecimal amount) {
        boolean success = random.nextInt(100) < 80;
        TransactionStatus status = success ? TransactionStatus.SUCCESS : TransactionStatus.FAILED;
        String gatewayRef = success ? "GW-" + UUID.randomUUID().toString().toUpperCase() : null;
        return new PaymentResult(status, gatewayRef);
    }

    @Getter
    public static class PaymentResult {
        private final TransactionStatus status;
        private final String gatewayRef;

        public PaymentResult(TransactionStatus status, String gatewayRef) {
            this.status = status;
            this.gatewayRef = gatewayRef;
        }

        public boolean isSuccess() {
            return status == TransactionStatus.SUCCESS;
        }
    }
}
