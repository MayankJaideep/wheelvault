import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getMyProfile, getMyListings, updateProfile, type Listing } from "@/lib/marketplace.functions";
import { supabase } from "@/integrations/supabase/client";
import { Package, Settings, LogOut, Plus, Edit3, Eye, EyeOff } from "lucide-react";

const profileQueryOptions = queryOptions({
  queryKey: ["my-profile"],
  queryFn: () => getMyProfile(),
});

const myListingsQueryOptions = queryOptions({
  queryKey: ["my-listings"],
  queryFn: () => getMyListings(),
});

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — WheelVault" },
      { name: "description", content: "Your WheelVault profile and listings." },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(profileQueryOptions);
    await context.queryClient.ensureQueryData(myListingsQueryOptions);
  },
  component: ProfilePage,
});

function ProfilePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: profileData } = useQuery(profileQueryOptions);
  const { data: listingsData } = useQuery(myListingsQueryOptions);
  const profile = profileData?.profile;
  const listings = listingsData?.listings ?? [];

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [location, setLocation] = useState(profile?.location ?? "");

  const updateFn = useServerFn(updateProfile);
  const updateMutation = useMutation({
    mutationFn: updateFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      setEditing(false);
    },
  });

  async function handleSave() {
    await updateMutation.mutateAsync({
      data: { display_name: displayName, bio, location },
    });
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row gap-8 mb-12">
        <div className="shrink-0">
          <div className="size-24 rounded-full bg-vault-800 flex items-center justify-center text-3xl font-semibold">
            {(profile?.display_name ?? "U")[0].toUpperCase()}
          </div>
        </div>
        <div className="flex-1">
          {editing ? (
            <div className="space-y-4">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-vault-900 border-none ring-1 ring-white/10 rounded-lg py-2 px-4 text-lg font-display font-semibold focus:ring-primary/50 outline-none text-foreground"
                placeholder="Display name"
              />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-vault-900 border-none ring-1 ring-white/10 rounded-lg py-2 px-4 text-sm focus:ring-primary/50 outline-none text-foreground placeholder:text-vault-500"
                placeholder="Location"
              />
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-vault-900 border-none ring-1 ring-white/10 rounded-lg py-2 px-4 text-sm focus:ring-primary/50 outline-none text-foreground placeholder:text-vault-500 resize-none"
                placeholder="Bio"
              />
              <div className="flex gap-3">
                <button onClick={handleSave} className="bg-primary text-vault-950 font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm">Save</button>
                <button onClick={() => setEditing(false)} className="bg-vault-900 text-foreground font-semibold px-4 py-2 rounded-lg hover:bg-vault-800 transition-colors text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-display font-semibold">{profile?.display_name ?? "Collector"}</h1>
                  {profile?.location && <p className="text-sm text-vault-400 mt-1">{profile.location}</p>}
                </div>
                <button onClick={() => setEditing(true)} className="p-2 text-vault-400 hover:text-foreground transition-colors">
                  <Edit3 className="size-4" />
                </button>
              </div>
              {profile?.bio && <p className="text-vault-400 mt-3 max-w-lg">{profile.bio}</p>}
              <div className="flex gap-6 mt-6 text-sm">
                <div>
                  <p className="text-2xl font-semibold">{listings.length}</p>
                  <p className="text-vault-500">Listings</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{listings.filter(l => l.status === "active").length}</p>
                  <p className="text-vault-500">Active</p>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="shrink-0">
          <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-vault-400 hover:text-destructive transition-colors">
            <LogOut className="size-4" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-display font-semibold">My Listings</h2>
        <a href="/sell" className="bg-primary text-vault-950 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus className="size-4" />
          New Listing
        </a>
      </div>

      {listings.length === 0 ? (
        <div className="py-16 text-center bg-vault-900/30 rounded-xl ring-1 ring-white/5">
          <Package className="size-10 mx-auto text-vault-700 mb-3" />
          <p className="text-vault-400">No listings yet.</p>
          <a href="/sell" className="text-primary hover:underline text-sm mt-2 inline-block">Create your first listing</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <MyListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

function MyListingCard({ listing }: { listing: Listing }) {
  const price = (listing.price_cents / 100).toFixed(2);
  const isActive = listing.status === "active";

  return (
    <div className="bg-vault-900/50 rounded-xl ring-1 ring-white/5 overflow-hidden flex flex-col">
      <div className="w-full aspect-[4/3] bg-vault-800 overflow-hidden relative">
        {listing.image_urls?.[0] ? (
          <img src={listing.image_urls[0]} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-vault-600">
            <Package className="size-8" />
          </div>
        )}
        <div className={`absolute top-3 right-3 px-2 py-1 rounded text-[10px] font-bold ${isActive ? "bg-primary/20 text-primary" : "bg-vault-800 text-vault-400"}`}>
          {isActive ? "ACTIVE" : "INACTIVE"}
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-medium truncate">{listing.title}</h3>
        <p className="text-xs text-vault-500">{listing.brand} {listing.series ? `· ${listing.series}` : ""}</p>
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5">
          <p className="font-semibold">${price}</p>
          <span className="text-xs text-vault-500">Stock: {listing.stock}</span>
        </div>
      </div>
    </div>
  );
}
