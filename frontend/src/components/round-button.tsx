import { Pressable, Text } from "react-native";

import { fonts, makeStyles, radius } from "@/src/theme";
import { haptics } from "@/src/utils/haptics";

type Props = {
  label: string;
  onPress: () => void;
  bg: string;
  fg: string;
  ring?: string;
  disabled?: boolean;
  testID?: string;
};

/** iOS Clock-style circular action button. */
export function RoundButton({ label, onPress, bg, fg, ring, disabled, testID }: Props) {
  const styles = useStyles();
  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      onPress={() => {
        haptics.medium();
        onPress();
      }}
      style={({ pressed }) => [
        styles.outer,
        { borderColor: ring ?? bg, opacity: disabled ? 0.35 : pressed ? 0.8 : 1 },
      ]}
    >
      <Text style={[styles.inner, { backgroundColor: bg, color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles(() => ({
  outer: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    borderWidth: 2,
    padding: 3,
  },
  inner: {
    flex: 1,
    borderRadius: radius.pill,
    textAlign: "center",
    textAlignVertical: "center",
    lineHeight: 74,
    fontFamily: fonts.textSemiBold,
    fontSize: 16,
  },
}));
