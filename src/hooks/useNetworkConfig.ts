import { useAccount } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { NETWORK_CONFIG, DEFAULT_CHAIN_ID } from '../config/contracts'

export function useNetworkConfig() {
  const { chain } = useAccount()
  const chainId = chain?.id ?? DEFAULT_CHAIN_ID
  const config = NETWORK_CONFIG[chainId] ?? NETWORK_CONFIG[sepolia.id]

  return {
    chainId,
    poolAddress: config.pool,
    tokens: config.tokens,
    explorerUrl: config.explorerUrl,
    config,
  }
}
