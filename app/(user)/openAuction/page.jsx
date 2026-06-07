import { Suspense } from "react";
import { UserAuctionsPage } from "@/components/ridehub/UserAuctionHub";

function AuctionHubFallback() {
  return (
    <div className="empty-state">
      <div>
        <h3>Loading auction hub</h3>
        <p>Fetching live auctions and your wins…</p>
      </div>
    </div>
  );
}

export default function AuctionsPage() {
  return (
    <Suspense fallback={<AuctionHubFallback />}>
      <UserAuctionsPage />
    </Suspense>
  );
}
