import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import {
  FilterIcon,
  FilterSortMainContainer,
  ItemDropDown,
  SubContainer,
} from '@/components/atoms';
import { useTheme } from '@/theme';
import SelectDropdown from 'react-native-select-dropdown';

type Tprops = {
  filterData: any;
  sortData: any;
};

export default function index({ filterData, sortData }: Tprops) {
  const { layout, borders } = useTheme();
  // console.log()
  return (
    <FilterSortMainContainer>
      <View style={[layout.flex_1, layout.itemsCenter]}>
        <SelectDropdown
          data={filterData}
          onSelect={(selectedItem, index) => {
            console.log(selectedItem, index);
          }}
          renderButton={(selectedItem, isOpened) => {
            return (
              <SubContainer selectedItem={selectedItem} isOpened={isOpened}>
                <FilterIcon iconName="filter-list" />
              </SubContainer>
            );
          }}
          renderItem={(item, index, isSelected) => {
            return (
              <ItemDropDown item={item} index={index} isSelected={isSelected} />
            );
          }}
          showsVerticalScrollIndicator={false}
          dropdownStyle={styles.dropdownMenuStyle}
        />
      </View>
      <View style={[{ flex: 0.001 }, layout.itemsCenter, borders.wRight_2]} />
      <View style={[layout.flex_1, layout.itemsCenter]}>
        <SelectDropdown
          data={sortData}
          onSelect={(selectedItem, index) => {
            console.log(selectedItem, index);
          }}
          renderButton={(selectedItem, isOpened) => {
            return (
              <SubContainer selectedItem={selectedItem} isOpened={isOpened}>
                <FilterIcon iconName="sort" />
              </SubContainer>
            );
          }}
          renderItem={(item, index, isSelected) => {
            return (
              <ItemDropDown item={item} index={index} isSelected={isSelected} />
            );
          }}
          showsVerticalScrollIndicator={false}
          dropdownStyle={styles.dropdownMenuStyle}
        />
      </View>
    </FilterSortMainContainer>
  );
}

const styles = StyleSheet.create({
  dropdownButtonStyle: {
    width: 200,
    height: 50,
    backgroundColor: '#E9ECEF',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#151E26',
  },
  dropdownButtonArrowStyle: {
    fontSize: 28,
  },
  dropdownButtonIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
  dropdownMenuStyle: {
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
  },
  dropdownItemStyle: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dropdownItemTxtStyle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#151E26',
  },
  dropdownItemIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
});
