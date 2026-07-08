import { BlurImage } from '@/components/blur-image'
import type { Conversation } from '@/features/workspace/types'
import { cn } from '@/lib/utils'

type BuyerLike = Conversation['buyer']

export function buyerDisplayName(buyer?: BuyerLike) {
  return buyer?.name?.trim() || buyer?.phone || 'Buyer'
}

export function buyerInitials(buyer?: BuyerLike) {
  const name = buyerDisplayName(buyer)
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'B'
}

type BuyerAvatarProps = {
  buyer?: BuyerLike
  className?: string
  imageClassName?: string
  showUnread?: boolean
}

export function BuyerAvatar({
  buyer,
  className,
  imageClassName,
  showUnread = false,
}: BuyerAvatarProps) {
  const photoUrl = buyer?.photoUrl?.trim()

  return (
    <div className={cn('relative shrink-0', className)}>
      <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-white/8 font-display text-[13px] font-bold text-lime-200">
        {photoUrl ? (
          <BlurImage
            alt={buyerDisplayName(buyer)}
            className={cn('h-full w-full object-cover', imageClassName)}
            src={photoUrl}
          />
        ) : (
          buyerInitials(buyer)
        )}
      </div>
      {showUnread ? (
        <span className="absolute bottom-0 right-0 z-10 h-3 w-3 rounded-full border-2 border-[#101014] bg-lime-300" />
      ) : null}
    </div>
  )
}
