import { ReactNode } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts, makeStyles, spacing } from "@/src/theme";

type Props = { title: string; right?: ReactNode; children?: ReactNode; testID?: string };

export function ScreenHeader({ title, right, children, testID }: Props) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]} testID={testID}>
      <View style={styles.row}>
        <Text style={styles.title} testID={`${testID ?? "screen"}-title`}>
          {title}
        </Text>
        {right}
      </View>
      {children}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.onSurface,
    letterSpacing: 0.5,
  },
}));
