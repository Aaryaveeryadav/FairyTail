import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, Phone, PhoneOff, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

type Signal =
  | { type: 'offer'; from: string; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; from: string; sdp: RTCSessionDescriptionInit }
  | { type: 'candidate'; from: string; candidate: RTCIceCandidateInit }
  | { type: 'hangup'; from: string };

export function VideoCall() {
  const { user, partner, couple } = useAuth();
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [inCall, setInCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const send = async (signal: Signal) => {
    await channelRef.current?.send({ type: 'broadcast', event: 'signal', payload: signal });
  };

  const cleanupPeer = () => {
    pcRef.current?.close();
    pcRef.current = null;
    pendingCandidates.current = [];
    if (remoteVideo.current) remoteVideo.current.srcObject = null;
    setInCall(false);
  };

  const ensurePeer = async (initiator: boolean) => {
    if (!user || !couple) throw new Error('You must be linked to your partner first.');
    if (pcRef.current) return pcRef.current;

    const stream = localStreamRef.current ?? await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    if (localVideo.current) localVideo.current.srcObject = stream;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });
    pcRef.current = pc;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      if (remoteVideo.current) remoteVideo.current.srcObject = event.streams[0];
    };
    pc.onicecandidate = (event) => {
      if (event.candidate && user) {
        void send({ type: 'candidate', from: user.id, candidate: event.candidate.toJSON() });
      }
    };
    pc.onconnectionstatechange = () => {
      if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
        setInCall(false);
      }
    };

    if (initiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await send({ type: 'offer', from: user.id, sdp: offer });
    }
    setInCall(true);
    return pc;
  };

  useEffect(() => {
    if (!couple || !user) return;
    const channel = supabase.channel(`video-call:${couple.id}`);
    channelRef.current = channel;
    channel.on('broadcast', { event: 'signal' }, async ({ payload }) => {
      const signal = payload as Signal;
      if (!signal || signal.from === user.id) return;
      try {
        if (signal.type === 'offer') {
          const pc = await ensurePeer(false);
          await pc.setRemoteDescription(signal.sdp);
          for (const candidate of pendingCandidates.current) await pc.addIceCandidate(candidate);
          pendingCandidates.current = [];
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await send({ type: 'answer', from: user.id, sdp: answer });
        } else if (signal.type === 'answer' && pcRef.current) {
          await pcRef.current.setRemoteDescription(signal.sdp);
          for (const candidate of pendingCandidates.current) await pcRef.current.addIceCandidate(candidate);
          pendingCandidates.current = [];
        } else if (signal.type === 'candidate') {
          if (pcRef.current?.remoteDescription) await pcRef.current.addIceCandidate(signal.candidate);
          else pendingCandidates.current.push(signal.candidate);
        } else if (signal.type === 'hangup') {
          cleanupPeer();
        }
      } catch (e) {
        console.error('WebRTC signaling error', e);
        setError(e instanceof Error ? e.message : 'Unable to connect the call.');
      }
    }).subscribe();

    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
      cleanupPeer();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    };
  }, [couple?.id, user?.id]);

  const startCall = async () => {
    setBusy(true);
    setError('');
    try {
      await ensurePeer(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Camera/microphone access failed.');
    } finally {
      setBusy(false);
    }
  };

  const hangup = async () => {
    if (user) await send({ type: 'hangup', from: user.id });
    cleanupPeer();
  };

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMuted(!track.enabled);
  };

  const toggleCamera = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraOff(!track.enabled);
  };

  if (!partner) {
    return <div className="p-6 rounded-2xl bg-white border border-cream-200 text-center text-sm text-ink-500">Link with your partner before starting a video call.</div>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-ink-900">Video Call</h2>
          <p className="text-sm text-ink-400">Private peer-to-peer call with {partner.display_name}</p>
        </div>
        <div className={`w-3 h-3 rounded-full ${inCall ? 'bg-green-500 animate-pulse' : 'bg-ink-200'}`} />
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-ink-900">
          <video ref={localVideo} autoPlay muted playsInline className="w-full h-full object-cover" />
          <span className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/50 text-white text-xs">You</span>
        </div>
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-ink-900">
          <video ref={remoteVideo} autoPlay playsInline className="w-full h-full object-cover" />
          {!inCall && <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm">Waiting for {partner.display_name}…</div>}
          <span className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/50 text-white text-xs">{partner.display_name}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        {!inCall ? (
          <button onClick={startCall} disabled={busy} className="px-5 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium disabled:opacity-60 flex items-center gap-2">
            <Phone className="w-4 h-4" /> {busy ? 'Starting…' : 'Start Call'}
          </button>
        ) : (
          <>
            <button onClick={toggleMute} className="p-3 rounded-xl bg-white border border-cream-200 hover:bg-cream-100" title={muted ? 'Unmute' : 'Mute'}>{muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}</button>
            <button onClick={toggleCamera} className="p-3 rounded-xl bg-white border border-cream-200 hover:bg-cream-100" title={cameraOff ? 'Turn camera on' : 'Turn camera off'}>{cameraOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}</button>
            <button onClick={hangup} className="p-3 rounded-xl bg-rose-500 text-white hover:bg-rose-600" title="End call"><PhoneOff className="w-5 h-5" /></button>
          </>
        )}
        {!inCall && <button onClick={() => window.location.reload()} className="p-3 rounded-xl bg-white border border-cream-200" title="Reload connection"><RotateCcw className="w-5 h-5" /></button>}
      </div>

      <p className="text-xs text-ink-400 text-center">Calls use WebRTC. Keep this page open in both browsers and allow camera/microphone access.</p>
    </div>
  );
}