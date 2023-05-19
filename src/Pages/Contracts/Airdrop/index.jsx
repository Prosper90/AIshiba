import { React, useMemo, useState } from "react";
import { Progress } from "flowbite-react";
import { useWeb3Modal } from '@web3modal/react'
import { useAccount, useNetwork, useSwitchNetwork, useDisconnect, useContractRead, useContractWrite } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './contants';
import { useSearchParams } from 'react-router-dom';

const Airdrop = () => {
  const chains = [ sepolia ];
  const [searchParams] = useSearchParams();
  const referrer = searchParams.get("address") || "0x0000000000000000000000000000000000000000";
  const { open } = useWeb3Modal();
  const { isConnected, address } = useAccount();
  const { chain: selectedChain } = useNetwork()
  const { isLoading: switchingNetwork, switchNetwork } = useSwitchNetwork()
  const { disconnect } = useDisconnect();
  const isValidChain = chains.some(chain => chain?.id === selectedChain?.id);
  const [canClaim, setCanClaim] = useState(true);
  const [pullingRecipients, setPullingRecipients] = useState(false);
  const explorer = selectedChain?.blockExplorers?.default;
  const recipientsUrl = "https://gist.githubusercontent.com/mavenharry1/12fb038946b810cad0ffae8ad3a850c9/raw/325361610a71c13558bdeace2a061726de5928b7/eligible-addresses-test";

  const handleOpenWallet = async () => {
    if (!isConnected) return await open({ route: "ConnectWallet" });
  }

  const getReadableAmount = (amount, format = false) => {
    amount = Number(amount);
    const readableAmount = ((Math.round(amount/10) * 10 ) / 10**18);
    return format ? readableAmount.toLocaleString() : readableAmount || 0;
  };

  const { data: writeData, isLoading: writing, isSuccess: writeSuccess, isError: writeFailed, write } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'claim',
    chainId: selectedChain?.id,
    args: [referrer],
  })

  const getAirdropRecipients = async () => {
    setPullingRecipients(true);
    try {
      let response = await fetch(recipientsUrl);
      let json = await response.json();
      return json
     } catch(error) {
      console.error(error);
    }
  }

  const getReason = (message) => {
    console.log(message, "check");
    const reasonRegex = /reason:\n([\s\S]*?)\n/;
    const reasonMatch = message?.match(reasonRegex);
    const reason = reasonMatch && reasonMatch?.[1]?.trim();
    return reason || "Something went wrong 😰"
  }

  const handleClaim = async () => {
    const recipients = await getAirdropRecipients();
    const isParticipant = recipients?.includes?.(address);
    if(isParticipant){
      setPullingRecipients(false);
      write({ account: address });
    }else{
      setCanClaim(false);
    }
  }

  let { data: readData, isError: contractError, error: readError, refetch } = useContractRead({
    enabled: !!address,
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    chainId: selectedChain?.id,
    functionName: 'getInfoView',
    args: [address]
  });
  readData = isValidChain ? readData : undefined;
  contractError = isValidChain ? contractError : true;

  const usedPercentaged = getReadableAmount(readData?.claimedCount, false) / getReadableAmount(readData?.numberOfClaimers, false) * 100 || 0;

  const {butonText, buttonAction} = useMemo(() => {
    const butonText = isConnected ? readData?.claimed? "Disconnect" : pullingRecipients? writing? "Claiming..." : "Verifying..." : "Claim" : "Connect Wallet";
    const buttonAction = isConnected ? readData?.claimed? disconnect : writing || pullingRecipients? () => null : handleClaim : handleOpenWallet;
    return { butonText, buttonAction };
  }, [isConnected, pullingRecipients, writing, readData]);

  return (
    <section className="m-4 p-4" id="airdrop">
      <div className="max-w-screen-xl mx-auto text-slate-50 font-jost py-10 px-4 lg:w-6/12 rounded-2xl border text-left border-orange-500 bg-gradient-to-b from-orange-950 to-neutral-950">
        <div className="text-center">
          <h5 className="font-bold text-[50px] pb-0 font-righteous">Claim Airdrop</h5>
          <p className="text-orange-500 leading-relaxed px-20">
            To qualify for claiming this airdrop, participants must be part of the previous Arbitrum ($ARB) airdrop participants.
          </p>
        </div>

        {!canClaim && (
          <h5 className="mt-6 font-bold text-[30px] pb-0 font-righteous text-center">You are not part of the previous Arbitrum ($ARB) airdrop participants</h5>
        )}

        {writeSuccess && canClaim && (
          <div className="text-center">
            <h5 className="mt-6 font-bold text-[30px] pb-0 font-righteous">You've successfully claimed airdrop</h5>
            <a 
              className="text-orange-500 leading-relaxed pt-5 underline text-[25px]"
              target="blank"
              href={`${explorer?.url}/tx/${writeData?.hash || ""}`}>
              View transaction on {explorer?.name}
            </a>
          </div>
        )}

        {!writeSuccess && canClaim && (
          <>
            {!readData && selectedChain? (
              contractError? (
                !isValidChain? (
                  <div className="text-center w-full">
                    <h5 className="mt-6 font-bold text-[30px] pb-0 font-righteous text-center">Wrong network connected</h5>
                    <button onClick={() => switchNetwork?.(chains?.[0]?.id)} className="!mt-[20px] !w-[30%] outline-none mx-auto px-5 py-3 rounded-md text-white bg-orange-500 hover:bg-orange-600 active:bg-orange-700 duration-150 shadow-md focus:shadow-none focus:ring-0 ring-offset-2 ring-orange-600 sm:mt-0 sm:ml-3 sm:w-auto">
                      {switchingNetwork? "Switching..." : `Switch to ${chains?.[0]?.name}`}
                    </button>
                  </div>
                ) : (
                  <div className="text-center w-full">
                    <h5 className="mt-6 font-bold text-[30px] pb-0 font-righteous text-center">{getReason(readError?.message)}</h5>
                    <button onClick={refetch} className="!mt-[20px] !w-[30%] outline-none mx-auto px-5 py-3 rounded-md text-white bg-orange-500 hover:bg-orange-600 active:bg-orange-700 duration-150 shadow-md focus:shadow-none focus:ring-0 ring-offset-2 ring-orange-600 sm:mt-0 sm:ml-3 sm:w-auto">
                      Refresh page
                    </button>
                  </div>
                )
              ) : (
                <h5 className="mt-6 font-bold text-[30px] pb-0 font-righteous text-center">Setting up...</h5>
              )
            ) : (
              readData?.airdropEnded? (
                <h5 className="mt-6 font-bold text-[30px] pb-0 font-righteous text-center">Airdrop has ended</h5>
              ) : (
                <div className="mt-6">
                  {readData && readData?.claimed? (
                    <h5 className="font-bold text-[30px] pb-0 font-righteous text-center">You've already claimed tokens</h5>
                  ) : (
                    <form
                      onSubmit={(e) => e.preventDefault()}
                      className="items-center justify-center sm:flex"
                    >
                      {readData && (
                        <input
                          disabled
                          readOnly
                          type="number"
                          placeholder={readData ? getReadableAmount(readData?.currentClaim, true) : "Your Airdrop Allocation"}
                          className="text-gray-500 w-full md:w-6/12 p-3 rounded-md border outline-none focus:border-orange-500"
                        />
                      )}

                      <button 
                        disabled={false}
                        onClick={buttonAction}
                        className={`${!readData && "!w-[30%]"} outline-none w-full mt-3 px-5 py-3 rounded-md text-white bg-orange-500 hover:bg-orange-600 active:bg-orange-700 duration-150 shadow-md focus:shadow-none focus:ring-0 ring-offset-2 ring-orange-600 sm:mt-0 sm:ml-3 sm:w-auto`}>
                        {butonText}
                      </button>
                    </form>
                  )}

                  {readData && (
                    <div className="mt-8 mb-4 mx-[85px]">
                      <Progress
                        progress={usedPercentaged}
                        labelProgress={true}
                        progressLabelPosition="outside"
                        textLabel={getReadableAmount(readData?.tokenBalance, true)}
                        labelText={true}
                        textLabelPosition="outside"
                        size="md"
                      />
                    </div>
                  )}
                </div>
              )
            )}
          </>
        )}
      </div>
    </section>
  )
};

export default Airdrop;
