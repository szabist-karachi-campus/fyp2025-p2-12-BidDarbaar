import RNBounceable from '@freakycoder/react-native-bounceable';
import { Image, Text, View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { useTheme } from '@/theme';

const defaultDataWith6Colors = [
  '#B0604D',
  '#899F9C',
  '#B3C680',
  '#5C6265',
  '#F5D399',
  '#F1F1F1',
];

const RenderCarousel = ({ item }: { item: any }) => {
  const { layout, gutters, fonts } = useTheme();

  return (
    <RNBounceable
      onPress={() => {}}
      style={{
        height: 300,
        borderWidth: 1,
        justifyContent: 'center',
        marginBottom: 10,
        borderRadius: 20,
        overflow: 'hidden',
      }}
    >
      <View>
        <Text style={[fonts.size_24]}>{item.title}</Text>
      </View>

      <Carousel
        loop={true}
        width={450}
        height={200}
        snapEnabled={true}
        pagingEnabled={false}
        autoPlay={false}
        data={item.avatar}
        renderItem={({ item }: { item: any }) => (
          <View
            style={{
              height: 200,
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <Image
              style={{
                width: '90%',
                height: '90%',
                borderColor: 'red',
                alignSelf: 'center',
              }}
              resizeMode="cover"
              source={{ uri: item }}
            />
          </View>
        )}
      />

      <View
        style={{
          height: 100,
          width: '100%',
          borderWidth: 1,
          borderColor: 'purple',
          justifyContent: 'center',
          paddingHorizontal: '2.5%',
        }}
      >
        <View style={{ flexDirection: 'row' }}>
          <Text>Title:</Text>
          <Text>{item.title}</Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Text>Description:</Text>
          <Text>{item.description}</Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Text>Starting Bid:</Text>
          <Text>{item.startingBid}</Text>
        </View>
      </View>
    </RNBounceable>
  );
};

export default RenderCarousel;
