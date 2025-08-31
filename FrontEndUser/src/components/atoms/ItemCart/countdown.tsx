import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/theme';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

type Tprop = {
  timeLeft: {
    BiddingStartTime: string;
    BiddingEndTime: string;
    BiddingDate: string;
  };
  wonItem?: {
    status: string;
    winDate: string;
  };
};

const Countdown = ({ timeLeft, wonItem }: Tprop) => {
  const { fonts, navigationTheme, variant, borders, gutters, layout } =
    useTheme();
  const [countdownText, setCountdownText] = useState<string | null>(null);

  useEffect(() => {
    if (wonItem) {
      return;
    }
    const { BiddingStartTime, BiddingEndTime, BiddingDate } = timeLeft;

    const calculateCountdown = () => {
      const now = new Date();
      const biddingDate = new Date(BiddingDate);
      const startTime = new Date(BiddingStartTime);
      const endTime = new Date(BiddingEndTime);
      if (now < biddingDate) {
        setCountdownText('Coming Soon');
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
  useEffect(() => {
    if (wonItem) {
      setCountdownText(`${wonItem.status}`);
    }
  }, [wonItem]);
  return (
    <View
      style={[
        {
          backgroundColor: 'tomato',
          alignItems: 'center',
        },
        borders.rounded_16,
        gutters.paddingHorizontal_12,
        layout.justifyCenter,
      ]}
    >
      <Text
        style={[fonts.bold, { color: 'white', fontSize: wonItem ? 15 : 11 }]}
      >
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
