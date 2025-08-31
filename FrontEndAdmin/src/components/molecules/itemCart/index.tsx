import React from 'react';
import {
  BottomCarousel,
  BottomCarouselContainer,
  Carousel,
  CarouselContainer,
  Countdown,
  DescriptionBox,
  TopCarousel,
} from '@/components/atoms';

type Tprops = {
  isLiked: boolean;
  setIsLiked: (value: boolean) => void;
  item: any;
  onPress: () => void;
  isAd?: boolean;
  budget: number;
  bidAmount: number;
};
export default function index({ item, onPress,isAd }: Tprops) {
  return (
    <CarouselContainer isAd={isAd}  onPress={onPress}>
      <TopCarousel>
        <Countdown
          timeLeft={{
            BiddingStartTime: item.BiddingStartTime,
            BiddingEndTime: item.BiddingEndTime,
            startDate: item.BiddingDate,
          }}
        />
      </TopCarousel>
      <DescriptionBox
        title={item.title}
        description={item.description}
        budget={item.budget}
        bidAmount={item.bidAmount}
      />
      <Carousel item={item} />
      <BottomCarouselContainer>
        <BottomCarousel data={item} />
      </BottomCarouselContainer>
    </CarouselContainer>
  );
}
