import { useCallback, useEffect, useState, useRef } from 'react';
import { MapPin, Battery, BatteryLow, BatteryFull, BatteryMedium, BatteryWarning, Navigation, Power } from 'lucide-react';

interface BatteryStatus {
  level: number;
}
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Location } from '@/lib/types';

function BatteryIcon({ level }: { level: number | null }) {
  if (level === null) return <Battery className="w-4 h-4" />;
  if (level <= 15) return <BatteryWarning className="w-4 h-4 text-red-500" />;
  if (level <= 40) return <BatteryLow className="w-4 h-4 text-amber-500" />;
  if (level <= 80) return <BatteryMedium className="w-4 h-4 text-ink-500" />;
  return <BatteryFull className="w-4 h-4 text-green-500" />;
}

export function LocationView() {
  const { user, profile, partner, couple } = useAuth();
  const [myLocation, setMyLocation] = useState<Location | null>(null);
  const [partnerLocation, setPartnerLocation] = useState<Location | null>(null);
  const [sharing, setSharing] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const loadLocations = useCallback(() => {
    if (!couple) return;
    supabase.from('locations').select('*').eq('couple_id', couple.id).then(({ data }) => {
      if (!data) return;
      setMyLocation((data.find((l) => l.user_id === user?.id) as Location) ?? null);
      setPartnerLocation((data.find((l) => l.user_id !== user?.id) as Location) ?? null);
    });
  }, [couple, user]);

  useEffect(() => {
    loadLocations();
    if (!couple) return;
    const channel = supabase
      .channel('locations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locations', filter: `couple_id=eq.${couple.id}` }, loadLocations)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadLocations, couple]);

  const startSharing = () => {
    if (!navigator.geolocation || !couple || !user) return;
    setSharing(true);
    navigator.geolocation.getCurrentPosition(updatePosition, () => setSharing(false), { enableHighAccuracy: true });
    watchIdRef.current = navigator.geolocation.watchPosition(updatePosition, () => {}, { enableHighAccuracy: true, maximumAge: 15000 });
  };

  const updatePosition = async (pos: GeolocationPosition) => {
    if (!couple || !user) return;
    const battery = await (navigator as Navigator & { getBattery?: () => Promise<BatteryStatus> }).getBattery?.().catch(() => null);
    const batteryLevel = battery ? Math.round(battery.level * 100) : null;
    const { data: existing } = await supabase.from('locations').select('id').eq('couple_id', couple.id).eq('user_id', user.id).maybeSingle();
    if (existing) {
      await supabase.from('locations').update({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        battery_level: batteryLevel,
        sharing_enabled: true,
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id);
    } else {
      await supabase.from('locations').insert({
        couple_id: couple.id,
        user_id: user.id,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        battery_level: batteryLevel,
        sharing_enabled: true,
      });
    }
    loadLocations();
  };

  const stopSharing = async () => {
    setSharing(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (myLocation) {
      await supabase.from('locations').update({ sharing_enabled: false }).eq('id', myLocation.id);
      loadLocations();
    }
  };

  const formatTimeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(ts).toLocaleDateString('en', { month: 'short', day: 'numeric' });
  };

  const mapsUrl = (loc: Location) => `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}&z=15&output=embed`;

  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      <h2 className="font-serif text-2xl text-ink-900">Live Location</h2>

      <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-300 to-rose-500 flex items-center justify-center text-white font-medium">
              {profile?.display_name?.[0]?.toUpperCase() ?? 'Y'}
            </div>
            <div>
              <p className="text-sm font-medium text-ink-900">You</p>
              <p className="text-xs text-ink-400">{sharing ? 'Sharing live' : myLocation?.sharing_enabled ? 'Sharing' : 'Not sharing'}</p>
            </div>
          </div>
          {sharing ? (
            <button onClick={stopSharing} className="px-4 py-2 rounded-xl bg-ink-100 text-ink-600 text-sm font-medium hover:bg-ink-200 transition-colors flex items-center gap-1.5">
              <Power className="w-4 h-4" /> Stop
            </button>
          ) : (
            <button onClick={startSharing} className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors flex items-center gap-1.5">
              <Navigation className="w-4 h-4" /> Share
            </button>
          )}
        </div>
        {myLocation && myLocation.sharing_enabled ? (
          <div className="space-y-2">
            <div className="rounded-xl overflow-hidden border border-cream-200">
              <iframe src={mapsUrl(myLocation)} className="w-full h-48" loading="lazy" title="Your location" />
            </div>
            <div className="flex items-center justify-between text-xs text-ink-400">
              <span className="flex items-center gap-1"><BatteryIcon level={myLocation.battery_level} /> {myLocation.battery_level !== null ? `${myLocation.battery_level}%` : 'Unknown'}</span>
              <span>Updated {formatTimeAgo(myLocation.updated_at)}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MapPin className="w-8 h-8 text-ink-300 mb-2" />
            <p className="text-sm text-ink-400">Not sharing your location</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ink-300 to-ink-500 flex items-center justify-center text-white font-medium">
            {partner?.display_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-ink-900">{partner?.display_name}</p>
            <p className="text-xs text-ink-400">{partnerLocation?.sharing_enabled ? 'Sharing live' : 'Not sharing'}</p>
          </div>
        </div>
        {partnerLocation && partnerLocation.sharing_enabled ? (
          <div className="space-y-2">
            <div className="rounded-xl overflow-hidden border border-cream-200">
              <iframe src={mapsUrl(partnerLocation)} className="w-full h-48" loading="lazy" title={`${partner?.display_name}'s location`} />
            </div>
            <div className="flex items-center justify-between text-xs text-ink-400">
              <span className="flex items-center gap-1"><BatteryIcon level={partnerLocation.battery_level} /> {partnerLocation.battery_level !== null ? `${partnerLocation.battery_level}%` : 'Unknown'}</span>
              <span>Updated {formatTimeAgo(partnerLocation.updated_at)}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MapPin className="w-8 h-8 text-ink-300 mb-2" />
            <p className="text-sm text-ink-400">{partner?.display_name} isn't sharing yet</p>
          </div>
        )}
      </div>
    </div>
  );
}