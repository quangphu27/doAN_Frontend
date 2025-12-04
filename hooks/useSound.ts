import { useEffect, useState } from 'react';
import { Audio } from 'expo-av';

export const useSound = () => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const playSound = async (soundType: 'correct' | 'failanswer') => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      let soundFile;
      switch (soundType) {
        case 'correct':
          soundFile = require('../assets/sounds/correct.mp3');
          break;
        case 'failanswer':
          soundFile = require('../assets/sounds/failanswer.mp3');
          break;
        default:
          return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(soundFile);
      setSound(newSound);
      await newSound.playAsync();
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  return { playSound };
};
