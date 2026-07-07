package com.project.BillX;

import com.project.BillX.model.Branch;
import com.project.BillX.exception.BusinessException;
import com.project.BillX.repository.BranchRepository;
import com.project.BillX.util.EncryptionUtil;
import com.project.BillX.util.RazorpayClientResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class RazorpayIntegrationTests {

    private EncryptionUtil encryptionUtil;
    private RazorpayClientResolver clientResolver;
    private BranchRepository branchRepository;

    @BeforeEach
    void setUp() {
        // Use a test JWT secret of 256 bits (32 bytes)
        String testSecret = "mySuperSecretJWTToken32BytesLongSecret!!";
        encryptionUtil = new EncryptionUtil(testSecret);
        branchRepository = Mockito.mock(BranchRepository.class);
        clientResolver = new RazorpayClientResolver(branchRepository, encryptionUtil);
    }

    @Test
    void testEncryptionDecryption() {
        String originalSecret = "rzp_test_secret_123456";
        String encrypted = encryptionUtil.encrypt(originalSecret);
        assertNotNull(encrypted);
        assertNotEquals(originalSecret, encrypted);

        String decrypted = encryptionUtil.decrypt(encrypted);
        assertEquals(originalSecret, decrypted);
    }

    @Test
    void testResolveClientNotConnectedThrowsException() {
        Long branchId = 1L;
        Branch branch = new Branch();
        branch.setId(branchId);
        branch.setRazorpayConnected(false);

        when(branchRepository.findById(branchId)).thenReturn(Optional.of(branch));

        BusinessException exception = assertThrows(BusinessException.class, () -> {
            clientResolver.resolveClientForBranch(branchId);
        });

        assertTrue(exception.getMessage().contains("Razorpay is not connected"));
    }

    @Test
    void testResolveClientConnectedSuccess() {
        Long branchId = 1L;
        Branch branch = new Branch();
        branch.setId(branchId);
        branch.setRazorpayKeyId("rzp_test_key_id");
        
        String encryptedSecret = encryptionUtil.encrypt("rzp_test_key_secret");
        branch.setRazorpayKeySecret(encryptedSecret);
        branch.setRazorpayConnected(true);

        when(branchRepository.findById(branchId)).thenReturn(Optional.of(branch));

        // It should resolve client without throwing an error
        // Note: RazorpayClient constructor validates inputs structure but does not hit the internet
        assertNotNull(clientResolver.resolveClientForBranch(branchId));
    }
}
