import type { TextFieldProps } from './TextField';
import { TextField } from './TextField';

export type TextAreaFieldProps = Omit<TextFieldProps, 'multiline'>;

export function TextAreaField(props: TextAreaFieldProps) {
  return <TextField {...props} multiline />;
}
