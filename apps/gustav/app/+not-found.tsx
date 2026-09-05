import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Body, Screen, Title } from '../src/design/components';
import { spacing } from '../src/design/tokens';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Nicht gefunden' }} />
      <Screen style={styles.container}>
        <Title>Diese Seite gibt es nicht.</Title>
        <Link href="/" asChild>
          <Body>Zurück zum Start</Body>
        </Link>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', gap: spacing.md },
});
