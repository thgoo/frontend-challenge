import type { QueryClient } from '@tanstack/react-query';
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/contracts/events';
import type { Nft, NftListResponse } from '@/contracts/nft';
import type { Order } from '@/contracts/order';
import { nftKeys } from '@/features/catalog/queries';
import { orderKeys } from '@/features/checkout/queries';

/** Cached data may already be newer than the event (e.g. after a refetch), so versions are compared again. */
function patchNft(nft: Nft, event: NftUpdatedEvent): Nft {
  if (nft.id !== event.resource.id || nft.version >= event.version) return nft;
  return {
    ...nft,
    version: event.version,
    editions: nft.editions.map((edition) => {
      const update = event.data.editions.find((candidate) => candidate.id === edition.id);
      return update
        ? { ...edition, priceEth: update.priceEth, available: update.available }
        : edition;
    }),
  };
}

export function applyNftUpdated(queryClient: QueryClient, event: NftUpdatedEvent) {
  queryClient.setQueryData<Nft>(
    nftKeys.detail(event.resource.id),
    (nft) => nft && patchNft(nft, event),
  );
  queryClient.setQueryData<Nft[]>(nftKeys.featured(), (nfts) =>
    nfts?.map((nft) => patchNft(nft, event)),
  );
  queryClient.setQueriesData<NftListResponse>({ queryKey: nftKeys.lists() }, (page) =>
    page ? { ...page, items: page.items.map((nft) => patchNft(nft, event)) } : page,
  );
}

export function applyOrderUpdated(
  queryClient: QueryClient,
  userId: string,
  event: OrderUpdatedEvent,
) {
  queryClient.setQueryData<Order>(orderKeys.detail(userId, event.resource.id), (order) =>
    order && order.version < event.version
      ? { ...order, ...event.data, version: event.version }
      : order,
  );
  void queryClient.invalidateQueries({ queryKey: orderKeys.all(userId), exact: true });
}
