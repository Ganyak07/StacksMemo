import { StacksMocknet } from '@stacks/network';
import { callReadOnlyFunction, contractPrincipalCV, uintCV } from '@stacks/transactions';

const network = new StacksMocknet();

const contractAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'; // Replace with your contract address
const contractName = 'stackmemo'; // Replace with your contract name

export async function getMessages(userAddress) {
  const functionName = 'get-message';
  const functionArgs = [uintCV(1)]; // Example: fetching message with ID 1

  try {
    const result = await callReadOnlyFunction({
      network,
      contractAddress,
      contractName,
      functionName,
      functionArgs,
      senderAddress: userAddress,
    });

    console.log('Result:', result);
    // TODO: Parse and return the result
    return [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

// Add more functions here to interact with your smart contract