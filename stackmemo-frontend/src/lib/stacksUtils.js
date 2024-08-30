import { StacksTestnet } from '@stacks/network';
import { 
  callReadOnlyFunction, 
  contractPrincipalCV, 
  uintCV,
  stringUtf8CV,
  cvToString
} from '@stacks/transactions';

const network = new StacksTestnet();

const contractAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'; // Replace with your contract address
const contractName = 'stackmemo'; // Replace with your contract name

export async function createMessage(doContractCall, message, unlockHeight) {
  const functionName = 'store-message';
  const functionArgs = [
    stringUtf8CV(message),
    uintCV(unlockHeight)
  ];

  const options = {
    network,
    contractAddress,
    contractName,
    functionName,
    functionArgs,
    onFinish: data => {
      console.log('Transaction:', data);
    },
  };

  await doContractCall(options);
}

export async function getMessage(userAddress, messageId) {
  const functionName = 'get-message';
  const functionArgs = [uintCV(messageId)];

  try {
    const result = await callReadOnlyFunction({
      network,
      contractAddress,
      contractName,
      functionName,
      functionArgs,
      senderAddress: userAddress,
    });

    if (result.value) {
      // Parse the result
      const messageData = result.value.data;
      return {
        id: messageId,
        sender: cvToString(messageData['sender']),
        message: cvToString(messageData['message']),
        unlockHeight: Number(messageData['unlock-height'].value)
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching message:', error);
    return null;
  }
}

export async function getMessages(userAddress) {
  // Since there's no function to get all messages, we'll fetch them one by one
  const messages = [];
  let messageId = 1;
  
  while (true) {
    const message = await getMessage(userAddress, messageId);
    if (message) {
      messages.push(message);
      messageId++;
    } else {
      break; // No more messages
    }
  }

  return messages;
}