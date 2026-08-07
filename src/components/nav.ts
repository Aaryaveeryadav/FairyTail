import { Home, MessageCircle, Image, Calendar, Heart, MapPin, Gamepad2, Video } from 'lucide-react';

export type TabId = 'home' | 'chat' | 'memories' | 'calendar' | 'love' | 'location' | 'together' | 'video';

export const TABS: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'memories', label: 'Memories', icon: Image },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'love', label: 'Love', icon: Heart },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'together', label: 'Together', icon: Gamepad2 },
  { id: 'video', label: 'Call', icon: Video },
];