import { useEffect, useRef, useState } from 'react';
import './App.css';

function App() {
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [displayLevel, setDisplayLevel] = useState(0);
  const [min, setMin] = useState(() => Number(localStorage.getItem('battery-min')) || 20);
  const [max, setMax] = useState(() => Number(localStorage.getItem('battery-max')) || 80);
  const [alarmPlaying, setAlarmPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [alarmSound, setAlarmSound] = useState('/alarm.mp3');
  const [isCharging, setIsCharging] = useState(false);
  const audioRef = useRef(null);

  // Animate battery fill from previous to new level
  useEffect(() => {
    if (batteryLevel === null) return;
    let animationFrame;
    const animate = () => {
      setDisplayLevel((prev) => {
        if (Math.abs(prev - batteryLevel) < 1) return batteryLevel;
        const step = (batteryLevel - prev) / 10;
        return prev + step;
      });
      if (Math.abs(displayLevel - batteryLevel) >= 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    animate();
    return () => cancelAnimationFrame(animationFrame);
    // eslint-disable-next-line
  }, [batteryLevel]);

  // Only check alarm when battery level changes
  useEffect(() => {
    if (batteryLevel === null) return;
    if (batteryLevel < min || batteryLevel > max) {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play();
        setAlarmPlaying(true);
      }
    } else {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setAlarmPlaying(false);
    }
    // eslint-disable-next-line
  }, [batteryLevel, alarmSound]); // depend on alarmSound too

  useEffect(() => {
    let battery;

    const handleBattery = () => {
      const level = Math.floor(battery.level * 100);
      setBatteryLevel(level);
      setIsCharging(battery.charging);
    };

    navigator.getBattery().then((batt) => {
      battery = batt;
      handleBattery();
      battery.addEventListener('levelchange', handleBattery);
      battery.addEventListener('chargingchange', handleBattery);
    });

    return () => {
      if (battery) {
        battery.removeEventListener('levelchange', handleBattery);
        battery.removeEventListener('chargingchange', handleBattery);
      }
    };
    // eslint-disable-next-line
  }, []);

  const handleStopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setAlarmPlaying(false);
  };

  const handleAlarmSoundChange = (e) => {
    setAlarmSound(e.target.value);
    // Stop current alarm if playing, so new sound can be previewed
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setAlarmPlaying(false);
  };

  // Save min/max to localStorage when changed
  useEffect(() => {
    localStorage.setItem('battery-min', min);
  }, [min]);
  useEffect(() => {
    localStorage.setItem('battery-max', max);
  }, [max]);

  return (
    <div className="App dark-theme fullscreen">
      <div className="header-elegant">
        <span className="battery-svg">
          <svg
            viewBox="0 0 48 48"
            fill="none"
            width="48"
            height="48"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 6H42L36 24L42 42H6L12 24L6 6Z"
              fill="currentColor"
            />
          </svg>
        </span>
        <span className="title-text">Battery Monitor</span>
      </div>
      <div className="battery-container elegant-battery">
        <div className="battery-body">
          <div
            className="battery-fill"
            style={{
              height: `${displayLevel}%`,
              backgroundColor:
                batteryLevel < min || batteryLevel > max ? '#00b4d8' : '#0077b6',
            }}
          ></div>
        </div>
        <p className="battery-text">
          {batteryLevel !== null ? `${batteryLevel}%` : 'Loading...'}
          {isCharging && (
            <span className="charging-icon" title="Charging">
              <i className="ri-battery-2-charge-line"></i>
            </span>
          )}
        </p>
      </div>
      <div className="selectors-box">
        <div className="selectors-title" style={{display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between'}}>
          <span>Threshold</span>
          <button
            className="settings-btn"
            aria-label="Settings"
            onClick={() => setShowSettings(true)}
            tabIndex={0}
            type="button"
          >
            <i className="ri-settings-3-line"></i>
          </button>
        </div>
        <div className="selectors-row">
          <label className="selector-label">
            <span>Min battery percentage</span>
            <input
              type="range"
              min={0}
              max={100}
              value={min}
              onChange={(e) => setMin(Number(e.target.value))}
              className="long-slider"
            />
            <span className="slider-value">{min}%</span>
          </label>
          <label className="selector-label">
            <span>Max battery percentage</span>
            <input
              type="range"
              min={0}
              max={100}
              value={max}
              onChange={(e) => setMax(Number(e.target.value))}
              className="long-slider"
            />
            <span className="slider-value">{max}%</span>
          </label>
        </div>
      </div>
      {showSettings && (
        <div className="settings-modal">
          <div className="settings-modal-content">
            <div className="settings-modal-header">
              <span>Alarm Sound</span>
              <button className="settings-close-btn" onClick={() => setShowSettings(false)} aria-label="Close settings">&times;</button>
            </div>
            <div className="settings-options">
              <label className="settings-radio">
                <input
                  type="radio"
                  name="alarmSound"
                  value="/alarm.mp3"
                  checked={alarmSound === '/alarm.mp3'}
                  onChange={handleAlarmSoundChange}
                />
                Default Beep
                <button
                  className="settings-preview-btn"
                  type="button"
                  onClick={() => {
                    const audio = new window.Audio('/alarm.mp3');
                    audio.play();
                  }}
                  tabIndex={0}
                  aria-label="Preview Default Beep"
                >
                  <i className="ri-play-circle-fill"></i>
                </button>
              </label>
              <label className="settings-radio">
                <input
                  type="radio"
                  name="alarmSound"
                  value="/alarm1.mp3"
                  checked={alarmSound === '/alarm1.mp3'}
                  onChange={handleAlarmSoundChange}
                />
                Alternate Beep
                <button
                  className="settings-preview-btn"
                  type="button"
                  onClick={() => {
                    const audio = new window.Audio('/alarm1.mp3');
                    audio.play();
                  }}
                  tabIndex={0}
                  aria-label="Preview Alternate Beep"
                >
                  <i className="ri-play-circle-fill"></i>
                </button>
              </label>
            </div>
          </div>
        </div>
      )}
      {alarmPlaying && (
        <button className="stop-btn" onClick={handleStopAlarm}>
          Stop Alarm
        </button>
      )}
      <audio ref={audioRef} src={alarmSound} loop />
    </div>
  );
}

export default App;
