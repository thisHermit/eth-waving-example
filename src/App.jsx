import React, {useEffect, useState} from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/WavePortal.json"

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const contractAddress = "0xBb44994B85247665c84Ff538aD7336572E322C6f";
  const contractABI = abi.abi;
  const [waves, setWaves] = useState(0);
  const [allWaves, setAllWaves] = useState([]);
  const [progress, setProgress] = useState(0);

  const getAllWaves = async () => {
    try {
      const {ethereum} = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waves = await wavePortalContract.getAllWaves();

        let wavesCleaned = [];
        waves.forEach(wave => wavesCleaned.push ({
          address: wave.waver,
          timestamp: new Date(wave.timestamp * 1000),
          message: wave.message
        }));

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const checkIfWalletIsConnected = async () => {
    try {
      const {ethereum} = window;
      if (!ethereum) {
        console.log("Metamask not found");
      } else {
        console.log("Ethereum object", ethereum);
      }

      const accounts = await ethereum.request({method: "eth_accounts"})
      
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const {ethereum} = window;

      if (!ethereum) {
        alert("Get Metamask!");
        return;
      }

      const accounts = await ethereum.request({method: "eth_requestAccounts"});

      console.log("Connected", accounts[0])
      setCurrentAccount(accounts[0])
    } catch (error) {
      console.log(error)
    }
  }
  const wave = async () => {
    try {
      setProgress(0);
      const {ethereum} = window;

      let message = document.getElementById("message").value;

      if (ethereum) {
        setProgress(16.66 * 1);

        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        
        setProgress(16.66 * 2);
        let count = await wavePortalContract.getTotalWaves();
        console.log("Retreived total wave count...", count.toNumber());

        setProgress(16.66 * 3);
        const waveTxn = await wavePortalContract.wave(message);
        console.log("Mining...", waveTxn.hash);

        setProgress(16.66 * 4);
        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        setProgress(16.66 * 5);
        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        
        setWaves(count.toNumber());
        setProgress(100);

        setTimeout(() => setProgress(0), 2000)
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      setProgress(0);
      console.log(error)
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        👋 Hey there!
        </div>

        <div className="bio">
        I am [Redacted]. Connect your Ethereum wallet and wave at me!
        Optionally add a message below.
        </div>

        <textarea id="message" placeholder="Default message"></textarea>
        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
        {progress == 0 ? (
          <div className="bio">
            Number of waves: {waves}
          </div>
        ) : (
          <div className= "bio">
            <label className="label" htmlFor="txn">Progress:</label>
            <progress id="txn" value={progress} max="100"></progress>
          </div>
          )
        }
        {allWaves.map((wave, index) => 
          <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px", borderRadius: "10px" }}>
            <div>Address: {wave.address}</div>
            <div>Time: {wave.timestamp.toString()}</div>
            <div>Message: {wave.message}</div>
          </div>
        )}

      </div>
    </div>
  );
}
