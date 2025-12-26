// Success sound using Web Audio API
export const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a pleasant chime/ding sound
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 - major chord
    
    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      const startTime = audioContext.currentTime + index * 0.1;
      const duration = 0.3;
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
  } catch (error) {
    console.log('Audio not supported:', error);
  }
};
