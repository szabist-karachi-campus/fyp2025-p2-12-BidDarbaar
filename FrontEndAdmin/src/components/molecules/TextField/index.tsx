import { KeyboardTypeOptions } from 'react-native';
import React, { useState } from 'react';
import TextBox from '@/components/atoms/Textfield/TextBox';
import IconBox from '@/components/atoms/Textfield/IconBox';
import Icon from '@/components/atoms/Textfield/Icon';
import TextInputBox from '@/components/atoms/Textfield/TextInputBox';
import TextInput from '@/components/atoms/Textfield/TextField';
import EyeIcon from '@/components/atoms/Textfield/EyeIcon';
import { HelperText } from 'react-native-paper';

type TextFieldProp = {
  placeholder: string;
  keyboardType?: KeyboardTypeOptions | undefined;
  secure?: boolean;
  iconName: string;
  error?: string;
  handleChange: (text: string) => void;
  onBlur: () => void;
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
  iconName,
  error,
  handleChange,
  onBlur,
  value,
  mask,
  disable,
  textFieldFontStyle,
  secureTextEntry,
}: TextFieldProp) {
  const [secureInput, setSecureInput] = useState<boolean>(secure ?? false);

  return (
    <>
      <TextBox>
        <IconBox>
          <Icon iconName={iconName} />
        </IconBox>
        <TextInputBox>
          <TextInput
            secure={secureInput}
            placeholder={placeholder}
            keyboardType={keyboardType}
            error={error}
            handleChange={handleChange}
            onBlur={onBlur}
            value={value}
            mask={mask}
            disable={disable}
            textFieldFontStyle={textFieldFontStyle}
            secureTextEntry={secureTextEntry}
          />
          {secure && (
            <EyeIcon secure={secureInput} setSecure={setSecureInput} />
          )}
        </TextInputBox>
      </TextBox>
      {error && (
        <HelperText type="error" visible={error ? true : false}>
          {error}
        </HelperText>
      )}
    </>
  );
}
