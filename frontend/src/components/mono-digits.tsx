import { Text, View } from "react-native";

import { fonts } from "@/src/theme";

// Fixed advance widths (em) so digits never jitter as they change.
const EM: Record<string, number> = { ":": 0.27, ".": 0.23, "-": 0.34, "−": 0.34 };
const DIGIT_EM = 0.47;
const charEm = (ch: string) => EM[ch] ?? DIGIT_EM;

type Props = {
  text: string;
  fontSize: number;
  color: string;
  /** colour for ":" "." separators; defaults to `color` */
  separatorColor?: string;
  fontFamily?: string;
  /** shrink to fit this width (keeps every glyph box proportional) */
  maxWidth?: number;
  lineHeight?: number;
  testID?: string;
};

export function MonoDigits({
  text,
  fontSize,
  color,
  separatorColor,
  fontFamily = fonts.display,
  maxWidth,
  lineHeight,
  testID,
}: Props) {
  const chars = text.split("");
  const totalEm = chars.reduce((sum, ch) => sum + charEm(ch), 0);
  const size = maxWidth ? Math.min(fontSize, maxWidth / totalEm) : fontSize;
  const lh = lineHeight ? (lineHeight / fontSize) * size : size * 1.05;

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end" }} testID={testID}>
      {chars.map((ch, i) => {
        const sep = ch in EM;
        return (
          <Text
            key={i}
            style={{
              width: charEm(ch) * size,
              textAlign: "center",
              fontSize: size,
              lineHeight: lh,
              fontFamily,
              color: sep && separatorColor ? separatorColor : color,
            }}
          >
            {ch}
          </Text>
        );
      })}
    </View>
  );
}
