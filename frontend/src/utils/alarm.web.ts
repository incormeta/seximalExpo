// Browsers cannot schedule the native app's local background notifications.
import { Asset } from 'expo-asset';
import { useCallback, useEffect, useRef } from 'react';
import type { NotifStatus } from './alarm';

export type { NotifStatus } from './alarm';
export async function getNotificationStatus(): Promise<NotifStatus> { return 'unsupported'; }
export async function requestNotificationPermission(): Promise<NotifStatus> { return 'unsupported'; }
export function openNotificationSettings() {}
export async function scheduleTimerNotification(_endAt: number, _label: string): Promise<string | null> { return null; }
export async function cancelTimerNotification(_id: string | null) {}
export function dismissDeliveredNotifications() {}

export function useAlarm() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const ringing = useRef(false);

  useEffect(() => {
    const source = Asset.fromModule(require('../../assets/sounds/alarm.wav'));
    const player = new Audio(source.uri);
    player.loop = true;
    player.preload = 'auto';
    audio.current = player;
    return () => {
      player.pause();
      player.removeAttribute('src');
      audio.current = null;
      ringing.current = false;
    };
  }, []);

  // Called directly from Start/Resume so Safari can authorize this audio element.
  const prepare = useCallback(() => {
    const player = audio.current;
    if (!player || ringing.current) return;
    player.muted = true;
    player.play().then(() => {
      if (!ringing.current) {
        player.pause();
        player.currentTime = 0;
      }
      player.muted = false;
    }).catch(() => { player.muted = false; });
  }, []);

  const start = useCallback(() => {
    const player = audio.current;
    if (!player || ringing.current) return;
    ringing.current = true;
    player.muted = false;
    player.currentTime = 0;
    player.play().catch(() => {});
  }, []);

  const stop = useCallback(() => {
    ringing.current = false;
    audio.current?.pause();
  }, []);

  return { start, stop, prepare };
}
