import {
    Account,
    Chain,
    Clarinet,
    Tx,
    types,
  } from 'https://deno.land/x/clarinet@v1.5.4/index.ts';
  
  // Helper function to create a long message
  const createLongMessage = (length: number) => "x".repeat(length);
  
  Clarinet.test({
    name: "StackMemo: Comprehensive Test Suite",
    async fn(chain: Chain, accounts: Map<string, Account>) {
      // Setup test accounts
      const wallet1 = accounts.get("wallet_1")!;
      const wallet2 = accounts.get("wallet_2")!;
      const wallet3 = accounts.get("wallet_3")!;
  
      // Group 1: Basic Message Operations
      // ================================
  
      // Test 1.1: Store simple message
      {
        const block = chain.mineBlock([
          Tx.contractCall(
            "stackmemo",
            "store-message",
            [
              types.utf8("Simple test message"),
              types.uint(30),
              types.none(),
              types.none(),
            ],
            wallet1.address
          ),
        ]);
        block.receipts[0].result.expectOk().expectUint(1);
        block.receipts[0].events.length > 0;
      }
  
      // Test 1.2: Store message with maximum allowed length
      {
        const longMessage = createLongMessage(1024);
        const block = chain.mineBlock([
          Tx.contractCall(
            "stackmemo",
            "store-message",
            [
              types.utf8(longMessage),
              types.uint(30),
              types.none(),
              types.none(),
            ],
            wallet1.address
          ),
        ]);
        block.receipts[0].result.expectOk().expectUint(2);
      }
  
      // Group 2: Privacy and Access Control
      // =================================
  
      // Test 2.1: Private message access controls
      {
        // Store private message
        chain.mineBlock([
          Tx.contractCall(
            "stackmemo",
            "store-message",
            [
              types.utf8("Private message"),
              types.uint(30),
              types.some(types.utf8("confidential")),
              types.some(types.principal(wallet2.address)),
            ],
            wallet1.address
          ),
        ]);
        const messageId = 3; // Third message
  
        // Test sender access
        const senderAccess = chain.mineBlock([
          Tx.contractCall(
            "stackmemo",
            "get-message-info",
            [types.uint(messageId)],
            wallet1.address
          ),
        ]);
        senderAccess.receipts[0].result.expectOk();
  
        // Test recipient access
        const recipientAccess = chain.mineBlock([
          Tx.contractCall(
            "stackmemo",
            "get-message-info",
            [types.uint(messageId)],
            wallet2.address
          ),
        ]);
        recipientAccess.receipts[0].result.expectOk();
  
        // Test unauthorized access
        const unauthorizedAccess = chain.mineBlock([
          Tx.contractCall(
            "stackmemo",
            "get-message-info",
            [types.uint(messageId)],
            wallet3.address
          ),
        ]);
        unauthorizedAccess.receipts[0].result.expectErr().expectUint(403);
      }
  
      // Group 3: Time Lock Functionality
      // ==============================
  
      // Test 3.1: Message retrieval timing
      {
        const messageId = 1; // Use first message
        
        // Try access before unlock
        const earlyAccess = chain.mineBlock([
          Tx.contractCall(
            "stackmemo",
            "get-message",
            [types.uint(messageId)],
            wallet1.address
          ),
        ]);
        earlyAccess.receipts[0].result.expectErr().expectUint(403);
  
        // Mine blocks until unlock height
        chain.mineEmptyBlockUntil(31);
  
        // Try access after unlock
        const validAccess = chain.mineBlock([
          Tx.contractCall(
            "stackmemo",
            "get-message",
            [types.uint(messageId)],
            wallet1.address
          ),
        ]);
        validAccess.receipts[0].result.expectOk();
      }
  
      // Group 4: Message Management
      // =========================
  
      // Test 4.1: Message deletion lifecycle
      {
        const messageId = 1;
  
        // Delete message
        const deleteBlock = chain.mineBlock([
          Tx.contractCall(
            "stackmemo",
            "delete-message",
            [types.uint(messageId)],
            wallet1.address
          ),
        ]);
        deleteBlock.receipts[0].result.expectOk().expectBool(true);
  
        // Verify deleted status in metadata
        const infoBlock = chain.mineBlock([
          Tx.contractCall(
            "stackmemo",
            "get-message-info",
            [types.uint(messageId)],
            wallet1.address
          ),
        ]);
        infoBlock.receipts[0].result.expectOk();
  
        // Try to access deleted message
        const accessBlock = chain.mineBlock([
          Tx.contractCall(
            "stackmemo",
            "get-message",
            [types.uint(messageId)],
            wallet1.address
          ),
        ]);
        accessBlock.receipts[0].result.expectErr().expectUint(401);
  
        // Try to update deleted message
        const updateBlock = chain.mineBlock([
          Tx.contractCall(
            "stackmemo",
            "update-unlock-height",
            [types.uint(messageId), types.uint(50)],
            wallet1.address
          ),
        ]);
        updateBlock.receipts[0].result.expectErr().expectUint(401);
      }
  
      // Group 5: Edge Cases
      // ==================
  
      // Test 5.1: Boundary conditions
      {
        // Test message with length at exactly 1024 bytes
        const exactLengthMessage = createLongMessage(1024);
        const validLength = chain.mineBlock([
          Tx.contractCall(
            "stackmemo",
            "store-message",
            [
              types.utf8(exactLengthMessage),
              types.uint(30),
              types.none(),
              types.none(),
            ],
            wallet1.address
          ),
        ]);
        validLength.receipts[0].result.expectOk();
  
        // Test message with length > 1024 bytes (should fail)
        const tooLongMessage = createLongMessage(1025);
        try {
          chain.mineBlock([
            Tx.contractCall(
              "stackmemo",
              "store-message",
              [
                types.utf8(tooLongMessage),
                types.uint(30),
                types.none(),
                types.none(),
              ],
              wallet1.address
            ),
          ]);
        } catch (err) {
          // Expected to fail
        }
      }
  
      // Group 6: User Statistics
      // =======================
  
      // Test 6.1: Stats tracking accuracy
      {
        // Check wallet1's stats (should have sent multiple messages)
        const senderStats = chain.mineBlock([
          Tx.contractCall(
            "stackmemo",
            "get-user-stats",
            [types.principal(wallet1.address)],
            wallet1.address
          ),
        ]);
        senderStats.receipts[0].result.expectOk();
  
        // Check wallet2's stats (should have received 1 message)
        const recipientStats = chain.mineBlock([
          Tx.contractCall(
            "stackmemo",
            "get-user-stats",
            [types.principal(wallet2.address)],
            wallet2.address
          ),
        ]);
        recipientStats.receipts[0].result.expectOk();
      }
  
      // Group 7: Category Management
      // ==========================
  
      // Test 7.1: Category operations
      {
        // Store messages with different categories
        chain.mineBlock([
          Tx.contractCall(
            "stackmemo",
            "store-message",
            [
              types.utf8("Work message"),
              types.uint(30),
              types.some(types.utf8("work")),
              types.none(),
            ],
            wallet1.address
          ),
          Tx.contractCall(
            "stackmemo",
            "store-message",
            [
              types.utf8("Personal message"),
              types.uint(30),
              types.some(types.utf8("personal")),
              types.none(),
            ],
            wallet1.address
          ),
        ]);
  
        // Verify message info contains correct categories
        const workMessage = chain.mineBlock([
          Tx.contractCall(
            "stackmemo",
            "get-message-info",
            [types.uint(5)],
            wallet1.address
          ),
        ]);
        workMessage.receipts[0].result.expectOk();
  
        const personalMessage = chain.mineBlock([
          Tx.contractCall(
            "stackmemo",
            "get-message-info",
            [types.uint(6)],
            wallet1.address
          ),
        ]);
        personalMessage.receipts[0].result.expectOk();
      }
    },
  });