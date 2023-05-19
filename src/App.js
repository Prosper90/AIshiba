import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import { BackTop } from 'antd';
import { Earn, Home, NoPage, ShiCod } from './Pages';
import { Navbar, Footer } from './Components';
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum'
import { Web3Modal } from '@web3modal/react'
import { configureChains, createConfig, WagmiConfig } from 'wagmi'
import { sepolia, arbitrum } from 'wagmi/chains'


const App = () => {
  const projectId = 'd9df94b0cdf68b7b2f16aa0472e402d6';
  const chains = [ sepolia, arbitrum ];
  const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);
  const wagmiConfig = createConfig({
    autoConnect: true,
    connectors: w3mConnectors({ projectId, version: 1, chains }),
    publicClient,
    logger: {
      warn: null,
    }
  })

  const ethereumClient = new EthereumClient(wagmiConfig, chains)

  return (
    <div className="App bg-gradient-to-b from-orange-950 to-neutral-950">
      <WagmiConfig config={wagmiConfig}>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path='/' element={<Home/>} />
            <Route path="/earn" element={<Earn />} />
            <Route path="/shicod" element={<ShiCod />} />
            <Route path="/*" element={<NoPage/>} />
          </Routes>
          <Footer/>
        </BrowserRouter>
      </WagmiConfig>

      <BackTop />
      <Web3Modal

        themeMode="dark"
        projectId={projectId}
        ethereumClient={ethereumClient}
        themeVariables={{
          '--w3m-font-family': 'Jost, sans-serif',
          '--w3m-accent-color': '#ff5a21',
          '--w3m-background-color': '#ff5a21',
          '--w3m-background-border-radius': '10px',
          '--w3m-container-border-radius': '10px',
          '--w3m-wallet-icon-border-radius': '10px'
        }}
      />
    </div>
  ) 
}

export default App 