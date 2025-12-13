import { describe, it, expect } from 'vitest'
import { sepolia, arbitrumSepolia, baseSepolia } from 'wagmi/chains'
import {
  NETWORK_CONFIG,
  DEFAULT_CHAIN_ID,
  POOL_ADDRESS,
  TOKENS,
  ERC20_ABI,
  POOL_ABI,
  Token,
  NetworkConfig,
} from './contracts'

describe('contracts config', () => {
  describe('NETWORK_CONFIG', () => {
    it('should have configuration for Sepolia', () => {
      const sepoliaConfig = NETWORK_CONFIG[sepolia.id]
      expect(sepoliaConfig).toBeDefined()
      expect(sepoliaConfig.pool).toBeDefined()
      expect(sepoliaConfig.tokens).toBeInstanceOf(Array)
      expect(sepoliaConfig.tokens.length).toBeGreaterThan(0)
    })

    it('should have configuration for Arbitrum Sepolia', () => {
      const arbitrumConfig = NETWORK_CONFIG[arbitrumSepolia.id]
      expect(arbitrumConfig).toBeDefined()
      expect(arbitrumConfig.pool).toBeDefined()
      expect(arbitrumConfig.tokens).toBeInstanceOf(Array)
      expect(arbitrumConfig.tokens.length).toBeGreaterThan(0)
    })

    it('should have configuration for Base Sepolia', () => {
      const baseConfig = NETWORK_CONFIG[baseSepolia.id]
      expect(baseConfig).toBeDefined()
      expect(baseConfig.pool).toBeDefined()
      expect(baseConfig.tokens).toBeInstanceOf(Array)
      expect(baseConfig.tokens.length).toBeGreaterThan(0)
    })

    it('should have valid Ethereum addresses for pools', () => {
      const addressRegex = /^0x[a-fA-F0-9]{40}$/

      Object.values(NETWORK_CONFIG).forEach((config) => {
        expect(config.pool).toMatch(addressRegex)
      })
    })

    it('should have valid token configurations', () => {
      const addressRegex = /^0x[a-fA-F0-9]{40}$/

      Object.values(NETWORK_CONFIG).forEach((config) => {
        config.tokens.forEach((token) => {
          expect(token.symbol).toBeDefined()
          expect(token.symbol.length).toBeGreaterThan(0)
          expect(token.name).toBeDefined()
          expect(token.name.length).toBeGreaterThan(0)
          expect(token.address).toMatch(addressRegex)
          expect(token.decimals).toBeGreaterThan(0)
          expect(token.decimals).toBeLessThanOrEqual(18)
        })
      })
    })
  })

  describe('Sepolia tokens', () => {
    const sepoliaTokens = NETWORK_CONFIG[sepolia.id].tokens

    it('should include DAI with correct decimals', () => {
      const dai = sepoliaTokens.find((t) => t.symbol === 'DAI')
      expect(dai).toBeDefined()
      expect(dai?.decimals).toBe(18)
    })

    it('should include USDC with correct decimals', () => {
      const usdc = sepoliaTokens.find((t) => t.symbol === 'USDC')
      expect(usdc).toBeDefined()
      expect(usdc?.decimals).toBe(6)
    })

    it('should include WETH with correct decimals', () => {
      const weth = sepoliaTokens.find((t) => t.symbol === 'WETH')
      expect(weth).toBeDefined()
      expect(weth?.decimals).toBe(18)
    })

    it('should include WBTC with correct decimals', () => {
      const wbtc = sepoliaTokens.find((t) => t.symbol === 'WBTC')
      expect(wbtc).toBeDefined()
      expect(wbtc?.decimals).toBe(8)
    })

    it('should include USDT with correct decimals', () => {
      const usdt = sepoliaTokens.find((t) => t.symbol === 'USDT')
      expect(usdt).toBeDefined()
      expect(usdt?.decimals).toBe(6)
    })
  })

  describe('DEFAULT_CHAIN_ID', () => {
    it('should be Sepolia chain ID', () => {
      expect(DEFAULT_CHAIN_ID).toBe(sepolia.id)
      expect(DEFAULT_CHAIN_ID).toBe(11155111)
    })
  })

  describe('Legacy exports', () => {
    it('POOL_ADDRESS should match Sepolia pool', () => {
      expect(POOL_ADDRESS).toBe(NETWORK_CONFIG[sepolia.id].pool)
    })

    it('TOKENS should match Sepolia tokens', () => {
      expect(TOKENS).toEqual(NETWORK_CONFIG[sepolia.id].tokens)
    })
  })

  describe('ERC20_ABI', () => {
    it('should include balanceOf function', () => {
      const balanceOf = ERC20_ABI.find((fn) => fn.name === 'balanceOf')
      expect(balanceOf).toBeDefined()
      expect(balanceOf?.type).toBe('function')
      expect(balanceOf?.stateMutability).toBe('view')
      expect(balanceOf?.inputs).toHaveLength(1)
      expect(balanceOf?.inputs[0].type).toBe('address')
    })

    it('should include approve function', () => {
      const approve = ERC20_ABI.find((fn) => fn.name === 'approve')
      expect(approve).toBeDefined()
      expect(approve?.type).toBe('function')
      expect(approve?.stateMutability).toBe('nonpayable')
      expect(approve?.inputs).toHaveLength(2)
    })

    it('should include allowance function', () => {
      const allowance = ERC20_ABI.find((fn) => fn.name === 'allowance')
      expect(allowance).toBeDefined()
      expect(allowance?.type).toBe('function')
      expect(allowance?.stateMutability).toBe('view')
      expect(allowance?.inputs).toHaveLength(2)
    })

    it('should include symbol function', () => {
      const symbol = ERC20_ABI.find((fn) => fn.name === 'symbol')
      expect(symbol).toBeDefined()
      expect(symbol?.type).toBe('function')
      expect(symbol?.stateMutability).toBe('view')
    })

    it('should include decimals function', () => {
      const decimals = ERC20_ABI.find((fn) => fn.name === 'decimals')
      expect(decimals).toBeDefined()
      expect(decimals?.type).toBe('function')
      expect(decimals?.stateMutability).toBe('view')
    })
  })

  describe('POOL_ABI', () => {
    it('should include supply function', () => {
      const supply = POOL_ABI.find((fn) => fn.name === 'supply')
      expect(supply).toBeDefined()
      expect(supply?.type).toBe('function')
      expect(supply?.stateMutability).toBe('nonpayable')
      expect(supply?.inputs).toHaveLength(4)
      expect(supply?.inputs.map((i) => i.name)).toEqual([
        'asset',
        'amount',
        'onBehalfOf',
        'referralCode',
      ])
    })

    it('should include withdraw function', () => {
      const withdraw = POOL_ABI.find((fn) => fn.name === 'withdraw')
      expect(withdraw).toBeDefined()
      expect(withdraw?.type).toBe('function')
      expect(withdraw?.stateMutability).toBe('nonpayable')
      expect(withdraw?.inputs).toHaveLength(3)
      expect(withdraw?.inputs.map((i) => i.name)).toEqual(['asset', 'amount', 'to'])
    })

    it('should include borrow function', () => {
      const borrow = POOL_ABI.find((fn) => fn.name === 'borrow')
      expect(borrow).toBeDefined()
      expect(borrow?.type).toBe('function')
      expect(borrow?.stateMutability).toBe('nonpayable')
      expect(borrow?.inputs).toHaveLength(5)
    })

    it('should include repay function', () => {
      const repay = POOL_ABI.find((fn) => fn.name === 'repay')
      expect(repay).toBeDefined()
      expect(repay?.type).toBe('function')
      expect(repay?.stateMutability).toBe('nonpayable')
      expect(repay?.inputs).toHaveLength(4)
    })

    it('should include getReserveData function', () => {
      const getReserveData = POOL_ABI.find((fn) => fn.name === 'getReserveData')
      expect(getReserveData).toBeDefined()
      expect(getReserveData?.type).toBe('function')
      expect(getReserveData?.stateMutability).toBe('view')
      expect(getReserveData?.inputs).toHaveLength(1)
      expect(getReserveData?.outputs).toHaveLength(1)
    })

    it('should include getUserAccountData function', () => {
      const getUserAccountData = POOL_ABI.find((fn) => fn.name === 'getUserAccountData')
      expect(getUserAccountData).toBeDefined()
      expect(getUserAccountData?.type).toBe('function')
      expect(getUserAccountData?.stateMutability).toBe('view')
      expect(getUserAccountData?.inputs).toHaveLength(1)
      expect(getUserAccountData?.outputs).toHaveLength(6)
      expect(getUserAccountData?.outputs.map((o) => o.name)).toEqual([
        'totalCollateralBase',
        'totalDebtBase',
        'availableBorrowsBase',
        'currentLiquidationThreshold',
        'ltv',
        'healthFactor',
      ])
    })
  })

  describe('Type interfaces', () => {
    it('Token interface should be correctly typed', () => {
      const token: Token = {
        symbol: 'TEST',
        name: 'Test Token',
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18,
      }
      expect(token.symbol).toBe('TEST')
      expect(token.name).toBe('Test Token')
      expect(token.decimals).toBe(18)
    })

    it('NetworkConfig interface should be correctly typed', () => {
      const config: NetworkConfig = {
        pool: '0x0000000000000000000000000000000000000000',
        tokens: [],
        explorerUrl: 'https://etherscan.io',
      }
      expect(config.pool).toBeDefined()
      expect(config.tokens).toEqual([])
      expect(config.explorerUrl).toBeDefined()
    })
  })
})
