import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/theme';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

type Tprop = {
  timeLeft: {
    BiddingStartTime: string;
    BiddingEndTime: string; 
    startDate: string; 
  };
};

const Countdown = ({ timeLeft }: Tprop) => {
  const { fonts, navigationTheme, variant, borders } = useTheme();
  const [countdownText, setCountdownText] = useState<string | null>(null);

  useEffect(() => {
    const { BiddingStartTime, BiddingEndTime } = timeLeft;

    const calculateCountdown = () => {
      const now = new Date();
      const startTime = new Date(BiddingStartTime);
      const endTime = new Date(BiddingEndTime);
      const startDate = new Date(timeLeft.startDate);
      if(now.getDate()<startDate.getDate()){
        const difference = startDate.getDate() - now.getDate();
        setCountdownText(`${difference} days`);
        return;
        
      }
      if (now < startTime) {
        setCountdownText('Coming Soon');
        return;
      }

      const difference = endTime.getTime() - now.getTime();

      if (difference > 0) {
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / (1000 * 60)) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setCountdownText(
          `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        );
      } else {
        setCountdownText('Bidding Ended');
      }
    };

    calculateCountdown();
    const intervalId = setInterval(calculateCountdown, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft]);

  return (
    <View
      style={[
        {
          backgroundColor: '#3B82F7',
          padding: 2,
          alignItems: 'center',
          height: '100%',
          width: '26%',
        },
        borders.rounded_16,
      ]}
    >
      <Text style={[fonts.bold, { color: 'white', fontSize: 11 }]}>
        <FontAwesome5
          name="stopwatch"
          color={variant === 'dark' ? 'white' : 'black'}
          size={12}
        />
        {'  ' + countdownText}
      </Text>
    </View>
  );
};

export default Countdown;
