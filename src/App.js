import { useEffect, useState } from "react";
import { ethers } from "ethers";
import erc20Abi from "./abi/erc20Abi.json";
import goodRollAbi from "./abi/goodRollAbi.json";
import rewardPool from "./abi/rewardPool.json";
import swapperAbi from "./abi/swapper.json";
import Timer from "./Timer";

const GOODROLLADDRESS = "0x91EedE6B6E489cB8FF82734dFABBfEbf7e58862d";
const BUSDADDRESS = "0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7";
const POOLREWARD = "0x7512984e5ce717fBd741b5E2D600E9344f4A4Eb6";
const SWAPPER = "0x3e9Da7Cad12D63478900A92F03536b5F084C4A52";

function App() {
  const [points, setPoints] = useState(0);
  const [balance, setBalance] = useState(0);
  const [tokenstoWallet, setTokensToWallet] = useState(0);
  const [tokensToBusd, setTokensToBusd] = useState(0);
  const [convertionRate, setConvertionRate] = useState(0);
  const [address, setAddress] = useState(null);

  const [goodRollContract, setGoodRollContract] = useState(null);
  const [erc20Contract, setErc20Contract] = useState(null);
  const [rewardPoolContract, setRewardPoolContract] = useState(null);
  const [swapperContract, setSwapperContract] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  const [balanceOfToken, setBalanceOfToken] = useState(0);
  const [busdBalance, setBusdBalance] = useState(0);

  const [coolDownTImer, setCoolDownTimer] = useState(0);

  const [tokenAllowance, setTokenAllowance] = useState(0);

  const connetWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      try {
        const signer = provider.getSigner();
        const accounts = await window.ethereum.enable();
        const network = await provider.getNetwork();
        if (network.chainId === 97) {
          try {
            const goodRollContract = new ethers.Contract(
              GOODROLLADDRESS,
              goodRollAbi,
              signer
            );
            const rewardPoolContract = new ethers.Contract(
              POOLREWARD,
              rewardPool,
              signer
            );
            const busdContract = new ethers.Contract(
              BUSDADDRESS,
              erc20Abi,
              signer
            );
            const swapperContract = new ethers.Contract(
              SWAPPER,
              swapperAbi,
              signer
            );
            setGoodRollContract(goodRollContract);
            setRewardPoolContract(rewardPoolContract);
            setErc20Contract(busdContract);
            setSwapperContract(swapperContract);
          } catch (err) {
            console.log(err);
          }
        }

        setAddress(accounts[0]);
      } catch (error) {
        console.log(error);
      }
    }
  }

  const getGoodRollBalance = async () => {
    if (goodRollContract) {
      const balance = await goodRollContract.balanceOf(address);
      const balanceToEth = ethers.utils.formatEther(balance);
      setBalanceOfToken(parseFloat(balanceToEth).toFixed(4));
    }
  }

  const getBusdBalance = async () => {
    if (erc20Contract) {
      const balance = await erc20Contract.balanceOf(address);
      const balanceToEth = ethers.utils.formatEther(balance);
      setBusdBalance(parseFloat(balanceToEth).toFixed(4));
    }
  }

  const verifyCoolDown = async () => {
    if (goodRollContract) {
      const coolDown = await goodRollContract.router_cooldown(address);
      setCoolDownTimer(parseFloat(coolDown));
      console.log(parseFloat(coolDown));
    }
  }

  const getReward = async (_amount) => {
    if (rewardPoolContract) {

      if (_amount < balance) {
        const amount = ethers.utils.parseEther(_amount);
        const reward = await rewardPoolContract.transferReward(amount);
        rewardPoolContract.on("Reward", (address, amount) => {
          console.log(address, amount)
          getGoodRollBalance();
          setBalance(parseFloat(balance) - parseFloat(_amount));
          setTokensToWallet(0);
        });

      } else {
        alert("You don't have enough tokens");
      }
    } else {
      alert("Please connect to the wallet");
    }
  }

  const swapTokens = async (_amount) => {
    if (swapperContract && erc20Contract) {
      if (_amount < balance) {
        const amount = ethers.utils.parseEther(_amount);
        const swap = await swapperContract.swapGRCtoBUSD(amount)
        swapperContract.on("swapSuccess", (address, amount) => {
          console.log(address, amount);
          getGoodRollBalance();
          setBalance(parseFloat(balance) - parseFloat(_amount));
          getGoodRollPrice();
          setTokensToBusd(0);
          getBusdBalance();
        })

      } else {
        alert("You don't have enough tokens");
      }

    } else {
      alert("Please connect to the wallet");
    }
  }

  const verifyApproval = async () => {
    if (goodRollContract && erc20Contract) {
      const allowance = await goodRollContract.allowance(address, POOLREWARD);
      setTokenAllowance(parseInt(allowance));
    }
  }

  const approve = async () => {
    if (goodRollContract && erc20Contract) {
      const approve = await goodRollContract.approve(POOLREWARD, ethers.utils.parseEther("100000000000000000000"));
      goodRollContract.on("Approval", (address, amount) => {
        console.log(address, amount)
        setTokenAllowance(parseInt(amount));
      });
    }
  }

  const getGoodRollPrice = async () => {
    if (rewardPoolContract) {
      try {
        const price = await rewardPoolContract.getTokenPrice("1");
        const priceToEth = ethers.utils.formatEther(price);
        setConvertionRate(parseFloat(priceToEth).toFixed(4));
      } catch (err) {
        console.log(err);
      }

    }
  }



  useEffect(() => {
    if (address) {
      getGoodRollBalance();
      getBusdBalance();
      verifyCoolDown();
      verifyApproval();
      getGoodRollPrice();
    }
  }, [address]);



  const getPoints = () => {
    //random number between 1 and 10
    if (address) {
      const randomNumber = Math.floor(Math.random() * 100) + 1;
      setPoints(points + randomNumber);
    } else {
      alert("Please connect to your wallet");
    }
  }

  const changePointsPerTokens = () => {
    if (address) {
      const tax = convertionRate / 10;
      const pointsPerToken = points * tax;
      const newBalance = balance + pointsPerToken;
      setBalance(newBalance);
      setPoints(0);
    }
  }




  return (
    <div className="App">
      <div className="connet">
        {address ?
          <>
            <span
              style={{
                marginRight: "20%",
              }}
            >GRC: {balanceOfToken}</span>
            <span
              style={{
                marginRight: "20%",
              }}
            >BUSD: {busdBalance}</span>
            <span>{address}</span>
          </>
          :
          <button onClick={connetWallet}>Connet</button>}
      </div>
      <div className="container">
        <div className="top-line">
          <div>
            Precio del token: {convertionRate}
          </div>

        </div>
        <div className="body-container">
          <div className="border color1"

          >
            <h3>juego</h3>
            <p> puntos: {points} </p>
            <button
              onClick={getPoints}
            >obtener puntos</button>
          </div>
          <div className="border color2">
            <h3>balance in game de tokens</h3>
            <p> {balance} </p>
            <button
              onClick={changePointsPerTokens}
            >puntos por token</button>
          </div>
        </div>
        <div className="button-body">
          <div className="border color3">
            <h3>tokens a wallet</h3>
            <input
              placeholder="cantidad"
              value={tokenstoWallet}
              onChange={(e) => setTokensToWallet(e.target.value)}
            />
            <br />
            {tokenAllowance >= tokenstoWallet ?
              <button
                onClick={() => getReward(tokenstoWallet)}
              >obtener tokens</button>
              :
              <button
                onClick={approve}
              > approve </button>
            }
          </div>
          <div className="border color4">
            <h3>tokens a busd</h3>
            <input
              placeholder="cantidad"
              value={tokensToBusd}
              onChange={(e) => setTokensToBusd(e.target.value)}
            />
            <br />

            <button
              onClick={() => swapTokens(tokensToBusd)}
            >obtener BUSD: {tokensToBusd * convertionRate}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
