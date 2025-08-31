import React from 'react';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

type Tprop = {
  setIsLiked?: () => void;
  isLiked: boolean;
};

export default function countDown({ setIsLiked, isLiked }: Tprop) {
  return (
    <FontAwesome
      onPress={setIsLiked}
      name={isLiked ? 'heart' : 'heart-o'}
      size={25}
      color={isLiked ? 'red' : 'white'}
    />
  );
}
