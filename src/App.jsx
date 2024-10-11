import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import abi from '../utils/MessageStore.json';
import './App.css';

// MessageStore deployed to: 0x238F0095AE9b8F53BE79Ace20b4BdD3e5793bBA7
const contractAddress = "0x238F0095AE9b8F53BE79Ace20b4BdD3e5793bBA7";
const MessageStoreABI = abi.abi;

function App() {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  
  const [message, setMessage] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [coffeeAmount, setCoffeeAmount] = useState('0.0005');
  const [myMessages, setMyMessages] = useState([]);
  const [pendingWithdrawal, setPendingWithdrawal] = useState('0');

  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          setAccount(address);

          const contractInstance = new ethers.Contract(contractAddress, MessageStoreABI, signer);
          setContract(contractInstance);

          loadUserData(contractInstance, address);
        } catch (error) {
          console.error("Error connecting to MetaMask", error);
        }
      } else {
        console.log('Please install MetaMask!');
      }
    };

    init();
  }, []);

  const loadUserData = async (contractInstance, address) => {
    try {
      const messages = await contractInstance.getMyMessages();
      setMyMessages(messages);

      const withdrawal = await contractInstance.getPendingWithdrawal(address);
      setPendingWithdrawal(ethers.formatEther(withdrawal));
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract) return;
    try {
      const amountInWei = ethers.parseEther(coffeeAmount);
      const tx = await contract.sendMessageWithCoffee(recipientAddress, message, {
        value: amountInWei
      });
      await tx.wait();
      console.log('Message sent with coffee successfully');
      setMessage('');
      setRecipientAddress('');
      
      loadUserData(contract, account);
    } catch (error) {
      console.error('Error sending message with coffee:', error);
    }
  };

  const handleWithdraw = async () => {
    if (!contract) return;
    try {
      const tx = await contract.withdrawCoffee();
      await tx.wait();
      console.log('Coffee withdrawn successfully');
      
      loadUserData(contract, account);
    } catch (error) {
      console.error('Error withdrawing coffee:', error);
    }
  };

  
  return (
    <div className="App">
      <h1>Coffee Message DApp</h1>
      {account ? (
        <>
          <p>Connected account: {account}</p>
          
          <h2>Send a Coffee Message</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="Recipient Address"
              required
            />
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message"
              required
            />
            <input
              type="number"
              value={coffeeAmount}
              onChange={(e) => setCoffeeAmount(e.target.value)}
              step="0.0001"
              min="0"
              placeholder="Coffee amount in ETH"
              required
            />
            <button type="submit">Send Message with Coffee</button>
          </form>

          <h2>My Received Messages</h2>
          <ul>
            {myMessages.map((msg, index) => (
              <li key={index}>
                From: {msg.sender}, Message: {msg.message}, Amount: {ethers.formatEther(msg.amount)} ETH
              </li>
            ))}
          </ul>

          <h2>Withdraw Your Coffee Money</h2>
          <p>Your pending withdrawal: {pendingWithdrawal} ETH</p>
          {parseFloat(pendingWithdrawal) > 0 ? (
            <button onClick={handleWithdraw}>Withdraw Coffee Money</button>
          ) : (
            <p>No funds available to withdraw.</p>
          )}
        </>
      ) : (
        <p>Please connect to MetaMask</p>
      )}
      
    </div>
  );
}

export default App;