import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

// import styles from "../styles/Home.module.css";
import { useEffect, useState } from "react";
import { useMetaMask, useConnectedMetaMask } from "metamask-react";
import Imagefollow from "react-image-follow";
import contractAbi from "../contracts/artifacts/MyTestBet.json";
import { ethers } from "ethers";
import moment from "moment";
import axios from "axios";

const CHAIN_ID = process.env.NODE_ENV == "development" ? "0x4" : "0x1";
const CHAIN_NAME =
    process.env.NODE_ENV == "development" ? "Rinkeby" : "Mainnet";

export default function Home() {
    const { status, connect, account, chainId, ethereum } = useMetaMask();
    // console.log(ethereum);
    // console.log(process.env.NEXT_PUBLIC_CONTRACT);

    const [cost, setCost] = useState(0);
    const [name, setName] = useState("");
    const [maxSupply, setMaxSupply] = useState(0);
    const [maxNFT, setMaxNFT] = useState(0);
    const [timelimit, setTimeLimit] = useState(0);
    const [totalSupply, setTotalSupply] = useState(0);
    const [balance, setBalance] = useState(0);
    const [winner, setWinner] = useState({});
    const [second, setSecond] = useState({});
    const [pass, setPass] = useState({});
    const [accWinner, setAccWinner] = useState("");
    const [accSecond, setAccSecond] = useState("");
    const [accPass, setAccPass] = useState("");

    const [addr, setAddr] = useState("");
    const [countdown, setCountdown] = useState("countdown");
    const [unit, setUnit] = useState(1);
    const [response, setResponse] = useState("");
    const [minted, setMinted] = useState(0);

    const shortenAddress = (address) =>
        `${address.slice(0, 5)}...${address.slice(address.length - 4)}`;

    const readIPFS = async (url) => {
        const { data } = await axios.get(
            `https://lunapepe.mypinata.cloud/ipfs/${url.replace("ipfs://", "")}`
        );

        return data;
    };

    const parseImage = (url) => {
        return url.slice(7, url.length);
    };

    useEffect(() => {
        setResponse("");

        if (status === "initializing") {
            setAddr("Synchronisation with MetaMask ongoing...");
        } else if (status === "unavailable") setAddr("MetaMask not available");
        else if (status === "notConnected") {
            setAddr("Connect to MetaMask");
            connect();
        } else if (status === "connecting") {
            setAddr("Connecting...");
        } else if (status === "connected") {
            setAddr(shortenAddress(account) + " [" + chainId + "]");
        }

        // return () => {
        //   second
        // }

        (async () => {
            try {
                const { ethereum } = window;

                if (ethereum) {
                    console.log("eth");
                    const provider = new ethers.providers.Web3Provider(
                        ethereum
                    );
                    // console.log(await provider.getBalance("ethers.eth"));
                    const signer = provider.getSigner();
                    const nftContract = new ethers.Contract(
                        process.env.NEXT_PUBLIC_CONTRACT,
                        contractAbi.abi,
                        signer
                    );

                    const _maxsupply = await nftContract.maxSupply();
                    const _maxNFT = await nftContract.maxNFTPerAccount();
                    const _totalsupply = await nftContract.totalSupply();
                    const _timelimit = await nftContract.timeLimit();
                    const _balance = await provider.getBalance(
                        process.env.NEXT_PUBLIC_CONTRACT
                    );

                    const winnerURI = await nftContract.tokenURI(
                        _totalsupply - 1
                    );
                    const secondURI = await nftContract.tokenURI(_totalsupply);
                    const passURI = await nftContract.tokenURI(
                        _totalsupply - 2
                    );

                    setAccWinner(await nftContract.ownerOf(_totalsupply - 1));
                    setAccSecond(await nftContract.ownerOf(_totalsupply));
                    setAccPass(await nftContract.ownerOf(_totalsupply - 2));

                    // console.log(winnerURI.replace("ipfs://", ""));
                    setWinner(await readIPFS(winnerURI));
                    setSecond(await readIPFS(secondURI));
                    setPass(await readIPFS(passURI));

                    setBalance(ethers.utils.formatEther(_balance));
                    setName(await nftContract.name());
                    setMaxSupply(_maxsupply.toNumber());
                    // setWinner(await nftContract.getWinner());
                    setMaxNFT(_maxNFT.toNumber());
                    setTimeLimit(_timelimit.toNumber());
                    setTotalSupply(_totalsupply.toNumber());
                    // console.log(ethers.utils.formatEther(_cost));

                    // console.log(cost);
                } else {
                    console.log("no eth");
                }
            } catch (err) {
                console.error(err);

                setName("n/a");
                setMaxSupply("n/a");
                setWinner("n/a");
                setMaxNFT("n/a");
                setTimeLimit("n/a");
                setTotalSupply("n/a");
                setBalance(0);
                setWinner({});
                setSecond({});
                setPass({});
            }
        })();
    }, [status, account, chainId, minted]);

    useEffect(() => {
        (async () => {
            try {
                const { ethereum } = window;

                if (ethereum) {
                    console.log("eth");
                    const provider = new ethers.providers.Web3Provider(
                        ethereum
                    );
                    // console.log(await provider.getBalance("ethers.eth"));
                    const signer = provider.getSigner();
                    const nftContract = new ethers.Contract(
                        process.env.NEXT_PUBLIC_CONTRACT,
                        contractAbi.abi,
                        signer
                    );

                    const _cost = await nftContract.getCurrentPrice(unit);
                    setCost(ethers.utils.formatEther(_cost));
                } else {
                    console.log("no eth");
                }
            } catch (err) {
                console.error(err);
                setCost("n/a");
            }
        })();
    }, [unit]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            const dur = moment.duration(
                moment(timelimit * 1000).diff(moment())
            );

            setCountdown(
                `${dur._data.days}d:${dur._data.hours}h:${dur._data.minutes}m:${dur._data.seconds}s`
            );
        }, 1000);

        return () => clearInterval(intervalId); //This is important
    }, [timelimit]);

    const hanleConnect = (status) => () => {
        if (status === "initializing") {
            setAddr("Synchronisation with MetaMask ongoing...");
        } else if (status === "unavailable") setAddr("MetaMask not available");
        else if (status === "notConnected") {
            setAddr("Connect to MetaMask");
            connect();
        } else if (status === "connecting") {
            setAddr("Connecting...");
        } else if (status === "connected") {
            setAddr(shortenAddress(account) + " [" + chainId + "]");
        }
    };

    const add = () => {
        setUnit(unit + 1);
    };

    const subtract = () => {
        if (unit > 1) {
            setUnit(unit - 1);
        }
    };

    const errManager = (message) => {
        const _match = String(message).match(/error=(.*?), method/);
        if (_match) {
            const error_code = JSON.parse(_match[1])["code"];

            if (error_code === -32000) {
                return "Insufficient funds for intrinsic transaction";
            } else {
                return JSON.parse(_match[1])["message"];
            }
        } else {
            if (typeof message === "object" && message !== null) {
                return message.message;
            }
            return message;
        }
    };

    const mint = async () => {
        setResponse("");
        if (!account) {
            setResponse("You are not connect web3");
            return;
        }

        if (chainId != CHAIN_ID) {
            setResponse(`Please switch to ${CHAIN_NAME}`);
            return;
        }

        try {
            const { ethereum } = window;

            if (ethereum) {
                const provider = new ethers.providers.Web3Provider(ethereum);
                // console.log(await provider.getBalance("ethers.eth"));
                const signer = provider.getSigner();
                const nftContract = new ethers.Contract(
                    process.env.NEXT_PUBLIC_CONTRACT,
                    contractAbi.abi,
                    signer
                );

                const _cost = await nftContract.getCurrentPrice(unit);
                // console.log(ethers.utils.formatEther(cost));
                // console.log(`unit: ${unit}`);
                // console.log(
                //     `cost: ${ethers.utils.parseEther(cost.toString())}`
                // );
                setResponse("Mining...");

                let nftTxn = await nftContract.Mint(unit, {
                    value: _cost,
                });

                const receipt = await nftTxn.wait();
                console.log("receipt: ", receipt);
                if (receipt.status == 1) {
                    setMinted(minted + 1);
                    // setResponse("Congrat");
                }
            }
        } catch (err) {
            console.error(err);
            setResponse(errManager(err));
        }
    };

    return (
        <div className="bg-black font-sfmono text-white">
            <Head>
                <title>Create Next App</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className="mx-auto min-h-screen max-w-7xl px-8 ">
                {/* header, darkmode toggle and connect button */}
                <div className=" flex h-fit flex-row items-center justify-center py-4 sm:justify-end">
                    <button
                        type="button"
                        className="btn "
                        onClick={hanleConnect(status)}
                    >
                        {addr}
                    </button>
                </div>

                {/* image follow  */}
                <div className="h-fit">
                    <div className="mask">
                        <div>
                            <Imagefollow
                                src="BG-Pepe.png"
                                alt="img"
                                style={{ height: "200px", objectFit: "cover" }}
                            />
                        </div>
                    </div>
                </div>

                {/* mint */}
                <div className="text-center">
                    <div>
                        <span>{totalSupply}</span>/<span>{maxSupply}</span>
                    </div>
                    <br />
                    <div className="flex flex-row justify-center space-x-2">
                        <div
                            className="hover:cursor-pointer"
                            onClick={subtract}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M18 12H6"
                                />
                            </svg>
                        </div>

                        <input
                            className="mb-4 w-10 text-center text-black"
                            type="text"
                            name="unit"
                            value={unit}
                            onChange={(e) => setUnit(+e.target.value)}
                        />
                        <div className="hover:cursor-pointer " onClick={add}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                        </div>
                    </div>
                    <button
                        type="button"
                        className=" btn mx-auto"
                        onClick={mint}
                    >
                        MINT
                    </button>
                    <div className="mt-2 ">
                        {ethers.constants.EtherSymbol} {cost}
                    </div>
                    <div
                        className={`my-4 min-h-[24px] rounded pt-[2px] text-xs sm:text-sm ${
                            response.length > 0
                                ? " inline-block bg-yellow-300 px-4 text-black"
                                : ""
                        }`}
                    >
                        {response}
                    </div>
                </div>

                {/* text runner */}

                {/* podium */}
                <div className=" flex justify-center">
                    <div className="relative h-[167px] text-gray-300 sm:h-[286px]">
                        <img
                            src="/Podium2.png"
                            alt="Podium"
                            height={286}
                            width={600}
                            // layout="responsive"
                        />
                        <div className="absolute top-[12px] left-[64px] flex h-[75px] w-[55px] flex-col justify-between sm:top-[20px] sm:left-[107px] sm:h-[130px] sm:w-[100px] sm:py-[2px]">
                            <div className="text-center text-xxs sm:text-xs">
                                Passed
                            </div>
                            <div className="mx-auto w-10/12">
                                {pass.image && (
                                    <img
                                        src={`https://lunapepe.mypinata.cloud/ipfs/${parseImage(
                                            pass.image
                                        )}`}
                                        alt="pass"
                                    />
                                )}
                            </div>
                            <div className="text-center text-xxs sm:text-xs">
                                {shortenAddress(accPass)}
                            </div>
                        </div>

                        <div className="absolute top-[12px] left-[156px] flex h-[75px] w-[55px] flex-col justify-between sm:top-[20px] sm:left-[264px] sm:h-[130px] sm:w-[100px] sm:py-[2px]">
                            <div className="text-center text-xxs sm:text-xs">
                                Winner
                            </div>
                            <div className="mx-auto w-10/12">
                                {winner.image && (
                                    <img
                                        src={`https://lunapepe.mypinata.cloud/ipfs/${parseImage(
                                            winner.image
                                        )}`}
                                        alt="winner"
                                    />
                                )}
                            </div>
                            <div className="text-center text-xxs sm:text-xs">
                                {shortenAddress(accWinner)}
                            </div>
                        </div>

                        <div className="absolute top-[12px] left-[251px]  flex h-[75px] w-[55px] flex-col justify-between sm:top-[20px] sm:left-[427px] sm:h-[130px] sm:w-[100px] sm:py-[2px]">
                            <div className="text-center text-xxs sm:text-xs">
                                Second
                            </div>
                            <div className="mx-auto w-10/12">
                                {second.image && (
                                    <img
                                        src={`https://lunapepe.mypinata.cloud/ipfs/${parseImage(
                                            second.image
                                        )}`}
                                        alt="second"
                                    />
                                )}
                            </div>
                            <div className="text-center text-xxs sm:text-xs">
                                {shortenAddress(accSecond)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* info */}
                <div className="text-center  text-white ">
                    <h1 className="text-center text-xl">Update info</h1>
                    <br />
                    <p>
                        <span>
                            <b>{name}</b>
                        </span>{" "}
                        game ends in{" "}
                        <span>
                            <b>
                                {/* {timelimit > 0 &&
                                    moment(timelimit * 1000).format()} */}
                                {countdown}
                            </b>
                        </span>{" "}
                        on blockchain
                    </p>
                    <br />
                    <div className="mx-auto sm:w-[500px]">
                        <table className="w-full text-xs sm:text-sm">
                            <tbody>
                                <tr>
                                    <td className="text-left">
                                        [info] The total supply
                                    </td>
                                    <td className="text-right">{`${maxSupply}`}</td>
                                </tr>
                                <tr>
                                    <td className="text-left">
                                        [info] The current mint amount
                                    </td>
                                    <td className="text-right">{`${totalSupply}`}</td>
                                </tr>
                                <tr>
                                    <td className="text-left">
                                        [info] The current price
                                    </td>
                                    <td className="text-right">{`${ethers.constants.EtherSymbol} ${cost}`}</td>
                                </tr>

                                <tr>
                                    <td className="text-left">
                                        [info] Total pool prize
                                    </td>
                                    <td className="text-right">{`${ethers.constants.EtherSymbol} ${balance}`}</td>
                                </tr>
                                <tr>
                                    <td className="text-left">
                                        [info] Winner prize
                                    </td>
                                    <td className="text-right">{`${
                                        ethers.constants.EtherSymbol
                                    } ${balance * 0.55}`}</td>
                                </tr>
                                <tr>
                                    <td className="text-left">
                                        [info] Second winner prize
                                    </td>
                                    <td className="text-right">{`${
                                        ethers.constants.EtherSymbol
                                    } ${balance * 0.05}`}</td>
                                </tr>
                                <tr>
                                    <td className="text-left">
                                        [info] Holder claim prize
                                    </td>
                                    <td className="text-right">{`${
                                        ethers.constants.EtherSymbol
                                    } ${(balance * 0.25) / totalSupply}`}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <br />
                    <br />
                    <h1 className="text-center text-xl ">Delay Halving info</h1>
                    <br />
                    <Image
                        src="/Halving.png"
                        alt="Halving"
                        width={900}
                        height={126}
                    />
                    <br />
                    <br />
                    <h1 className="text-center text-xl">Claim your prize</h1>
                    <p className="text-sm">
                        Your prize can calim after the game ended
                    </p>
                    <br />
                    <br />
                    <p className="text-sm">
                        Contract address :{" "}
                        <b>{process.env.NEXT_PUBLIC_CONTRACT}</b>
                    </p>
                    <br />

                    <div className="flex justify-center pb-10">
                        <Link href="https://twitter.com/FelizPlanet" passHref>
                            <svg
                                version="1.1"
                                id="Logo"
                                xmlns="http://www.w3.org/2000/svg"
                                x="0px"
                                y="0px"
                                viewBox="0 0 248 204"
                                className="w-8 cursor-pointer fill-gray-200 sm:w-8"
                            >
                                <g id="Logo_1_">
                                    <path
                                        id="white_background"
                                        d="M221.95,51.29c0.15,2.17,0.15,4.34,0.15,6.53c0,66.73-50.8,143.69-143.69,143.69v-0.04
		C50.97,201.51,24.1,193.65,1,178.83c3.99,0.48,8,0.72,12.02,0.73c22.74,0.02,44.83-7.61,62.72-21.66
		c-21.61-0.41-40.56-14.5-47.18-35.07c7.57,1.46,15.37,1.16,22.8-0.87C27.8,117.2,10.85,96.5,10.85,72.46c0-0.22,0-0.43,0-0.64
		c7.02,3.91,14.88,6.08,22.92,6.32C11.58,63.31,4.74,33.79,18.14,10.71c25.64,31.55,63.47,50.73,104.08,52.76
		c-4.07-17.54,1.49-35.92,14.61-48.25c20.34-19.12,52.33-18.14,71.45,2.19c11.31-2.23,22.15-6.38,32.07-12.26
		c-3.77,11.69-11.66,21.62-22.2,27.93c10.01-1.18,19.79-3.86,29-7.95C240.37,35.29,231.83,44.14,221.95,51.29z"
                                    />
                                </g>
                            </svg>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
