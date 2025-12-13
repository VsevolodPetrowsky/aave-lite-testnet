import { describe, it, expect, beforeAll, vi } from 'vitest'

// Increase timeout for network calls
vi.setConfig({ testTimeout: 30000 })
import { createPublicClient, http, Address } from 'viem'
import { sepolia } from 'viem/chains'
import { NETWORK_CONFIG, ERC20_ABI, POOL_ABI } from '../config/contracts'

/**
 * Integration tests that verify real contracts on testnets.
 * These tests make actual RPC calls to verify:
 * 1. Contracts exist and are accessible
 * 2. ABI is compatible with deployed contracts
 * 3. Basic read operations work correctly
 *
 * Note: Sepolia tests require SEPOLIA_RPC_URL env variable due to rate limiting
 * on public RPCs. Arbitrum and Base Sepolia use reliable public RPCs.
 */

// Use env variable for Sepolia or skip tests
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL || ''

// Skip Sepolia tests if no RPC URL provided
const describeSepoliaTests = SEPOLIA_RPC ? describe : describe.skip

describeSepoliaTests('Sepolia Testnet Integration Tests (requires SEPOLIA_RPC_URL)', () => {
  const config = NETWORK_CONFIG[sepolia.id]
  let client: ReturnType<typeof createPublicClient>

  beforeAll(() => {
    client = createPublicClient({
      chain: sepolia,
      transport: http(SEPOLIA_RPC),
    })
  })

  describe('Pool Contract', () => {
    it('should have valid Pool contract at configured address', async () => {
      const code = await client.getBytecode({ address: config.pool })
      expect(code).toBeDefined()
      expect(code!.length).toBeGreaterThan(2) // Not just "0x"
    })

    it('should be able to call getUserAccountData', async () => {
      // Use zero address to test the function works
      const zeroAddress = '0x0000000000000000000000000000000000000000' as Address

      const result = await client.readContract({
        address: config.pool,
        abi: POOL_ABI,
        functionName: 'getUserAccountData',
        args: [zeroAddress],
      })

      // Should return a tuple with 6 values
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(6)
    })

    it('should be able to call getReserveData for each token', async () => {
      for (const token of config.tokens) {
        const result = await client.readContract({
          address: config.pool,
          abi: POOL_ABI,
          functionName: 'getReserveData',
          args: [token.address],
        })

        expect(result).toBeDefined()
        // Check aTokenAddress is returned
        expect(result.aTokenAddress).toBeDefined()
        expect(result.aTokenAddress).toMatch(/^0x[a-fA-F0-9]{40}$/)
        // Check it's not zero address (meaning reserve is configured)
        expect(result.aTokenAddress).not.toBe('0x0000000000000000000000000000000000000000')
      }
    })
  })

  describe('Token Contracts', () => {
    it('should have valid contracts for all configured tokens', async () => {
      for (const token of config.tokens) {
        const code = await client.getBytecode({ address: token.address })
        expect(code, `Token ${token.symbol} should have bytecode`).toBeDefined()
        expect(code!.length).toBeGreaterThan(2)
      }
    })

    it('should be able to read token symbol', async () => {
      for (const token of config.tokens) {
        const symbol = await client.readContract({
          address: token.address,
          abi: ERC20_ABI,
          functionName: 'symbol',
        })

        expect(symbol).toBe(token.symbol)
      }
    })

    it('should be able to read token decimals', async () => {
      for (const token of config.tokens) {
        const decimals = await client.readContract({
          address: token.address,
          abi: ERC20_ABI,
          functionName: 'decimals',
        })

        expect(Number(decimals)).toBe(token.decimals)
      }
    })

    it('should be able to read balanceOf (zero address)', async () => {
      const zeroAddress = '0x0000000000000000000000000000000000000000' as Address

      for (const token of config.tokens) {
        const balance = await client.readContract({
          address: token.address,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [zeroAddress],
        })

        expect(typeof balance).toBe('bigint')
        expect(balance).toBeGreaterThanOrEqual(0n)
      }
    })
  })

  describe('aToken Contracts', () => {
    it('should have valid aToken contracts for all reserves', async () => {
      for (const token of config.tokens) {
        // Get aToken address from pool
        const reserveData = await client.readContract({
          address: config.pool,
          abi: POOL_ABI,
          functionName: 'getReserveData',
          args: [token.address],
        })

        const aTokenAddress = reserveData.aTokenAddress

        // Verify aToken contract exists
        const code = await client.getBytecode({ address: aTokenAddress })
        expect(code, `aToken for ${token.symbol} should have bytecode`).toBeDefined()
        expect(code!.length).toBeGreaterThan(2)

        // Verify aToken is ERC20 compatible
        const symbol = await client.readContract({
          address: aTokenAddress,
          abi: ERC20_ABI,
          functionName: 'symbol',
        })

        // aToken symbols typically start with 'a' (e.g., aDAI, aUSDC)
        expect(symbol).toContain('a')
      }
    })
  })

  describe('End-to-end Flow Verification', () => {
    it('should verify deposit flow is possible (read-only check)', async () => {
      const testToken = config.tokens[0] // DAI
      const testAddress = '0x1234567890123456789012345678901234567890' as Address

      // 1. Can read token balance
      const balance = await client.readContract({
        address: testToken.address,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [testAddress],
      })
      expect(typeof balance).toBe('bigint')

      // 2. Can read allowance
      const allowance = await client.readContract({
        address: testToken.address,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [testAddress, config.pool],
      })
      expect(typeof allowance).toBe('bigint')

      // 3. Can read reserve data
      const reserveData = await client.readContract({
        address: config.pool,
        abi: POOL_ABI,
        functionName: 'getReserveData',
        args: [testToken.address],
      })
      expect(reserveData.aTokenAddress).toBeDefined()

      // 4. Can read aToken balance
      const aTokenBalance = await client.readContract({
        address: reserveData.aTokenAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [testAddress],
      })
      expect(typeof aTokenBalance).toBe('bigint')

      // 5. Can read user account data
      const accountData = await client.readContract({
        address: config.pool,
        abi: POOL_ABI,
        functionName: 'getUserAccountData',
        args: [testAddress],
      })
      expect(accountData.length).toBe(6)
    })

    it('should verify all tokens have liquidity in the pool', async () => {
      for (const token of config.tokens) {
        const reserveData = await client.readContract({
          address: config.pool,
          abi: POOL_ABI,
          functionName: 'getReserveData',
          args: [token.address],
        })

        // Check liquidityIndex > 0 (means pool has been initialized)
        expect(reserveData.liquidityIndex).toBeGreaterThan(0n)
      }
    })
  })
})

describe('Arbitrum Sepolia Integration Tests', () => {
  const config = NETWORK_CONFIG[421614] // Arbitrum Sepolia chain ID
  let client: ReturnType<typeof createPublicClient>

  beforeAll(() => {
    client = createPublicClient({
      chain: {
        id: 421614,
        name: 'Arbitrum Sepolia',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://sepolia-rollup.arbitrum.io/rpc'] } },
      },
      transport: http('https://sepolia-rollup.arbitrum.io/rpc'),
    })
  })

  it('should have valid Pool contract', async () => {
    const code = await client.getBytecode({ address: config.pool })
    expect(code).toBeDefined()
    expect(code!.length).toBeGreaterThan(2)
  })

  it('should have valid token contracts', async () => {
    for (const token of config.tokens) {
      const symbol = await client.readContract({
        address: token.address,
        abi: ERC20_ABI,
        functionName: 'symbol',
      })
      expect(symbol).toBe(token.symbol)
    }
  })
})

describe('Base Sepolia Integration Tests', () => {
  const config = NETWORK_CONFIG[84532] // Base Sepolia chain ID
  let client: ReturnType<typeof createPublicClient>

  beforeAll(() => {
    client = createPublicClient({
      chain: {
        id: 84532,
        name: 'Base Sepolia',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://sepolia.base.org'] } },
      },
      transport: http('https://sepolia.base.org'),
    })
  })

  it('should have valid Pool contract', async () => {
    const code = await client.getBytecode({ address: config.pool })
    expect(code).toBeDefined()
    expect(code!.length).toBeGreaterThan(2)
  })

  it('should have valid token contracts', async () => {
    for (const token of config.tokens) {
      const symbol = await client.readContract({
        address: token.address,
        abi: ERC20_ABI,
        functionName: 'symbol',
      })
      expect(symbol).toBe(token.symbol)
    }
  })
})
