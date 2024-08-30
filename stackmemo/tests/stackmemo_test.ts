import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.5.4/index.ts';
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

Clarinet.test({
    name: "Ensure that messages can be stored and retrieved correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const user1 = accounts.get('wallet_1')!;

        let block = chain.mineBlock([
            Tx.contractCall('stackmemo', 'store-message', [types.utf8("Hello, future!"), types.uint(10)], user1.address)
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2);
        block.receipts[0].result.expectOk().expectUint(1);

        let result = chain.callReadOnlyFn('stackmemo', 'get-message', [types.uint(1)], deployer.address);
        result.result.expectErr().expectUint(403);

        chain.mineEmptyBlockUntil(12);

        result = chain.callReadOnlyFn('stackmemo', 'get-message', [types.uint(1)], deployer.address);
        const msg = result.result.expectOk().expectTuple();
        assertEquals(msg['message'], types.utf8("Hello, future!"));
    },
});