import { TextInput, KeyboardTypeOptions } from 'react-native';
import React from 'react';
import { useTheme } from '@/theme';
import { MaskedTextInput } from 'react-native-mask-text';

type TextFieldProp = {
  placeholder: string;
  keyboardType?: KeyboardTypeOptions | undefined;
  secure?: boolean;
  error?: string;
  handleChange?: (text: string) => void;
  onBlur?: () => void;
  value: any;
  mask?: string;
  disable?: boolean;
  textFieldFontStyle?: any;
  secureTextEntry?: boolean;
};
export default function TextField({
  placeholder,
  keyboardType,
  secure,
  error,
  handleChange,
  onBlur,
  value,
  mask,
  disable,
  textFieldFontStyle,
  secureTextEntry,
}: TextFieldProp) {
  const { layout, fonts, variant } = useTheme();
  function replacePrefix(inputString: string) {
    if (inputString.startsWith('92')) {
      return '0' + inputString.slice(2);
    }
    return inputString;
  }
  return mask ? (
    <MaskedTextInput
      value={value}
      selectTextOnFocus={true}
      mask={mask}
      onChangeText={(text, rawText) => {
        if (handleChange) {
          handleChange(rawText);
        }
      }}
      onBlur={onBlur}
      editable={!disable}
      style={[layout.flex_1, layout.fullHeight, fonts.gray800]}
      placeholderTextColor={variant === 'dark' ? 'white' : 'black'}
      placeholder={'+92 000 000 0000'}
    />
  ) : (
    <TextInput
      editable={!disable}
      style={[
        layout.flex_1,
        layout.fullHeight,
        fonts.gray800,
        textFieldFontStyle && textFieldFontStyle,
      ]}
      placeholder={placeholder}
      keyboardType={keyboardType ? keyboardType : 'default'}
      secureTextEntry={secure || secureTextEntry ? true : false}
      placeholderTextColor={variant === 'dark' ? 'white' : 'black'}
      onChange={(e) => (handleChange ? handleChange(e.nativeEvent.text) : {})}
      onBlur={onBlur}
      value={value}
    />
  );
}
