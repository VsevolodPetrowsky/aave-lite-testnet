import { useAccount, useSwitchChain } from 'wagmi'
import { sepolia, arbitrumSepolia, baseSepolia } from 'wagmi/chains'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

const SUPPORTED_CHAINS = [
  { id: sepolia.id, name: 'Sepolia', shortName: 'SEP' },
  { id: arbitrumSepolia.id, name: 'Arbitrum Sepolia', shortName: 'ARB' },
  { id: baseSepolia.id, name: 'Base Sepolia', shortName: 'BASE' },
] as const

type SupportedChainId = typeof SUPPORTED_CHAINS[number]['id']

export function NetworkSwitcher() {
  const { chain } = useAccount()
  const { switchChain, isPending } = useSwitchChain()

  const currentChain = SUPPORTED_CHAINS.find(c => c.id === chain?.id) ?? SUPPORTED_CHAINS[0]

  return (
    <Select
      value={String(currentChain.id)}
      onValueChange={(value) => switchChain({ chainId: Number(value) as SupportedChainId })}
      disabled={isPending}
    >
      <SelectTrigger className="w-[140px] h-9">
        <SelectValue>
          {isPending ? 'Switching...' : currentChain.shortName}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_CHAINS.map((c) => (
          <SelectItem key={c.id} value={String(c.id)}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
